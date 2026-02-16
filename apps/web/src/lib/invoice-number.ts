/**
 * Shared invoice number generation utility.
 * Generates atomic F{year}-{seq} invoice numbers within a transaction.
 */

type PrismaClient = {
  invoice: {
    findFirst: (args: any) => Promise<any>;
  };
};

export async function generateInvoiceNumber(
  prisma: PrismaClient,
  practiceId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.invoice.findFirst({
    where: { practiceId, invoiceNumber: { startsWith: `F${year}` } },
    orderBy: { invoiceNumber: 'desc' },
  });
  const seq = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1
    : 1;
  return `F${year}-${String(seq).padStart(4, '0')}`;
}
