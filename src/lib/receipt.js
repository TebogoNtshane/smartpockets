import jsPDF from "jspdf";

export function downloadReceipt(contribution, pocket){
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("MyStokvel - Official Receipt", 20, 20);
  doc.setFontSize(11);
  doc.text(`Group: ${pocket.name} (${pocket.join_code})`, 20, 35);
  doc.text(`Member: ${contribution.user_name} - ${contribution.user_email}`, 20, 42);
  doc.text(`Type: ${contribution.type} ${contribution.is_late ? "(LATE)" : "(On-time)"}`, 20, 49);
  doc.text(`Amount: R${Number(contribution.amount).toFixed(2)}`, 20, 56);
  doc.text(`Date: ${contribution.contribution_date}`, 20, 63);
  doc.text(`Receipt ID: ${contribution.id}`, 20, 70);
  doc.setFontSize(9);
  doc.text("Thank you for saving with MyStokvel! 0800 123 4567", 20, 95);
  doc.save(`Receipt-${contribution.id}.pdf`);
}