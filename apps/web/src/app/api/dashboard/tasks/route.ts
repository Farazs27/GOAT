import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

interface UnifiedTask {
  id: string;
  type: 'clinical-note' | 'invoice' | 'prescription' | 'treatment-plan' | 'treatment' | 'custom';
  title: string;
  patientId: string | null;
  patientName: string | null;
  patientNumber: string | null;
  status: 'NOT_DONE' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  navigationPath: string | null;
  taskId: string | null; // DentistTask id if exists
  category: string;
  metadata?: Record<string, unknown>;
}

function buildNavigationPath(type: string, patientId: string | null, targetId?: string, extraId?: string): string | null {
  if (!patientId) return null;
  switch (type) {
    case 'clinical-note': return `/patients/${patientId}?section=notities&autoOpen=true`;
    case 'invoice': return `/billing?patientId=${patientId}${targetId ? `&invoiceId=${targetId}` : ''}`;
    case 'prescription': return `/patients/${patientId}?tab=prescriptions`;
    case 'treatment-plan': return `/patients/${patientId}?section=behandelingen&planId=${targetId || ''}`;
    case 'treatment': return `/patients/${patientId}?section=behandelingen${extraId ? `&planId=${extraId}` : ''}`;
    case 'custom': return `/patients/${patientId}`;
    default: return `/patients/${patientId}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'nog-te-voltooien' | 'behandelplannen'
    const countOnly = url.searchParams.get('countOnly') === 'true';

    if (!type || !['nog-te-voltooien', 'behandelplannen'].includes(type)) {
      throw new ApiError('type parameter required: nog-te-voltooien or behandelplannen', 400);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (type === 'nog-te-voltooien') {
      return await handleNogTeVoltooien(user, todayStart, todayEnd, countOnly);
    } else {
      return await handleBehandelplannen(user, countOnly);
    }
  } catch (error) {
    return handleError(error);
  }
}

async function handleNogTeVoltooien(
  user: { id: string; practiceId: string },
  todayStart: Date,
  todayEnd: Date,
  countOnly: boolean
) {
  const tasks: UnifiedTask[] = [];

  // 1. Clinical notes created today (draft/progress notes needing review)
  const clinicalNotes = await prisma.clinicalNote.findMany({
    where: {
      practiceId: user.practiceId,
      authorId: user.id,
      createdAt: { gte: todayStart, lt: todayEnd },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
    },
  });

  // 2. Invoices: DRAFT, SENT, or OVERDUE
  const invoices = await prisma.invoice.findMany({
    where: {
      practiceId: user.practiceId,
      status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
    },
  });

  // 3. Custom tasks: not done, due today or overdue or no due date
  const customTasks = await prisma.dentistTask.findMany({
    where: {
      userId: user.id,
      practiceId: user.practiceId,
      status: { not: 'DONE' },
      category: { not: 'TREATMENT' }, // TREATMENT category goes to behandelplannen
      OR: [
        { dueDate: null },
        { dueDate: { lt: todayEnd } },
      ],
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
    },
  });

  // Check existing DentistTask overrides for auto-generated items
  const existingOverrides = await prisma.dentistTask.findMany({
    where: {
      userId: user.id,
      practiceId: user.practiceId,
      targetType: { not: null },
      targetId: { not: null },
    },
    select: { targetType: true, targetId: true, status: true },
  });
  const overrideMap = new Map(
    existingOverrides.map(o => [`${o.targetType}:${o.targetId}`, o.status])
  );

  // Build unified task list
  for (const note of clinicalNotes) {
    const override = overrideMap.get(`clinical-note:${note.id}`);
    if (override === 'DONE') continue;
    tasks.push({
      id: note.id,
      type: 'clinical-note',
      title: `Klinische notitie - ${note.noteType}`,
      patientId: note.patient.id,
      patientName: `${note.patient.firstName} ${note.patient.lastName}`,
      patientNumber: note.patient.patientNumber,
      status: (override as UnifiedTask['status']) || 'NOT_DONE',
      priority: 'NORMAL',
      dueDate: null,
      navigationPath: buildNavigationPath('clinical-note', note.patient.id),
      taskId: null,
      category: 'CLINICAL_NOTE',
    });
  }

  for (const inv of invoices) {
    const override = overrideMap.get(`invoice:${inv.id}`);
    if (override === 'DONE') continue;
    tasks.push({
      id: inv.id,
      type: 'invoice',
      title: `Factuur ${inv.invoiceNumber} - €${Number(inv.total).toFixed(2)}`,
      patientId: inv.patient.id,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      patientNumber: inv.patient.patientNumber,
      status: (override as UnifiedTask['status']) || (inv.status === 'OVERDUE' ? 'NOT_DONE' : 'NOT_DONE'),
      priority: inv.status === 'OVERDUE' ? 'HIGH' : 'NORMAL',
      dueDate: inv.dueDate?.toISOString() || null,
      navigationPath: buildNavigationPath('invoice', inv.patient.id, inv.id),
      taskId: null,
      category: 'INVOICE',
      metadata: { invoiceStatus: inv.status },
    });
  }

  for (const task of customTasks) {
    tasks.push({
      id: task.id,
      type: 'custom',
      title: task.title,
      patientId: task.patient?.id || null,
      patientName: task.patient ? `${task.patient.firstName} ${task.patient.lastName}` : null,
      patientNumber: task.patient?.patientNumber || null,
      status: task.status as UnifiedTask['status'],
      priority: task.priority as UnifiedTask['priority'],
      dueDate: task.dueDate?.toISOString() || null,
      navigationPath: buildNavigationPath('custom', task.patient?.id || null),
      taskId: task.id,
      category: task.category,
    });
  }

  if (countOnly) {
    return Response.json({ count: tasks.length });
  }

  // Sort: high priority first, then by due date
  const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return Response.json({ tasks, count: tasks.length });
}

async function handleBehandelplannen(
  user: { id: string; practiceId: string },
  countOnly: boolean
) {
  const tasks: UnifiedTask[] = [];

  // 1. Individual treatments with status PLANNED or IN_PROGRESS
  const treatments = await prisma.treatment.findMany({
    where: {
      practiceId: user.practiceId,
      status: { in: ['PLANNED', 'IN_PROGRESS'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
      tooth: { select: { toothNumber: true } },
      treatmentPlan: { select: { id: true, title: true } },
      nzaCode: { select: { code: true, descriptionNl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Treatment plans: pending statuses
  const treatmentPlans = await prisma.treatmentPlan.findMany({
    where: {
      practiceId: user.practiceId,
      status: { in: ['DRAFT', 'PROPOSED', 'ACCEPTED', 'IN_PROGRESS'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
    },
  });

  // 3. Custom tasks with category TREATMENT
  const customTasks = await prisma.dentistTask.findMany({
    where: {
      userId: user.id,
      practiceId: user.practiceId,
      category: 'TREATMENT',
      status: { not: 'DONE' },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
    },
  });

  // Check overrides
  const existingOverrides = await prisma.dentistTask.findMany({
    where: {
      userId: user.id,
      practiceId: user.practiceId,
      targetType: { in: ['treatment', 'treatment-plan'] },
      targetId: { not: null },
    },
    select: { targetType: true, targetId: true, status: true },
  });
  const overrideMap = new Map(
    existingOverrides.map(o => [`${o.targetType}:${o.targetId}`, o.status])
  );

  for (const plan of treatmentPlans) {
    const override = overrideMap.get(`treatment-plan:${plan.id}`);
    if (override === 'DONE') continue;
    tasks.push({
      id: plan.id,
      type: 'treatment-plan',
      title: plan.title || 'Behandelplan',
      patientId: plan.patient.id,
      patientName: `${plan.patient.firstName} ${plan.patient.lastName}`,
      patientNumber: plan.patient.patientNumber,
      status: (override as UnifiedTask['status']) || (plan.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_DONE'),
      priority: 'NORMAL',
      dueDate: null,
      navigationPath: buildNavigationPath('treatment-plan', plan.patient.id, plan.id),
      taskId: null,
      category: 'TREATMENT',
      metadata: { planStatus: plan.status },
    });
  }

  for (const t of treatments) {
    const override = overrideMap.get(`treatment:${t.id}`);
    if (override === 'DONE') continue;
    const toothLabel = t.tooth ? ` - element ${t.tooth.toothNumber}` : '';
    const codeLabel = t.nzaCode ? `${t.nzaCode.code}: ` : '';
    tasks.push({
      id: t.id,
      type: 'treatment',
      title: `${codeLabel}${t.description}${toothLabel}`,
      patientId: t.patient.id,
      patientName: `${t.patient.firstName} ${t.patient.lastName}`,
      patientNumber: t.patient.patientNumber,
      status: (override as UnifiedTask['status']) || (t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_DONE'),
      priority: 'NORMAL',
      dueDate: null,
      navigationPath: buildNavigationPath('treatment', t.patient.id, t.id, t.treatmentPlan?.id),
      taskId: null,
      category: 'TREATMENT',
      metadata: {
        treatmentPlanId: t.treatmentPlan?.id,
        treatmentPlanTitle: t.treatmentPlan?.title,
        toothNumber: t.tooth?.toothNumber,
      },
    });
  }

  for (const task of customTasks) {
    tasks.push({
      id: task.id,
      type: 'custom',
      title: task.title,
      patientId: task.patient?.id || null,
      patientName: task.patient ? `${task.patient.firstName} ${task.patient.lastName}` : null,
      patientNumber: task.patient?.patientNumber || null,
      status: task.status as UnifiedTask['status'],
      priority: task.priority as UnifiedTask['priority'],
      dueDate: task.dueDate?.toISOString() || null,
      navigationPath: buildNavigationPath('custom', task.patient?.id || null),
      taskId: task.id,
      category: 'TREATMENT',
    });
  }

  if (countOnly) {
    return Response.json({ count: tasks.length });
  }

  return Response.json({ tasks, count: tasks.length });
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { title, description, category, patientId, dueDate, priority } = body;

    if (!title) {
      throw new ApiError('Titel is verplicht', 400);
    }

    const validCategories = ['CLINICAL_NOTE', 'INVOICE', 'PRESCRIPTION', 'TREATMENT', 'CUSTOM'];
    if (category && !validCategories.includes(category)) {
      throw new ApiError('Ongeldige categorie', 400);
    }

    if (patientId) {
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, practiceId: user.practiceId },
      });
      if (!patient) throw new ApiError('Patiënt niet gevonden', 404);
    }

    const task = await prisma.dentistTask.create({
      data: {
        practiceId: user.practiceId,
        userId: user.id,
        patientId: patientId || null,
        title,
        description: description || null,
        category: category || 'CUSTOM',
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'NORMAL',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
      },
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
