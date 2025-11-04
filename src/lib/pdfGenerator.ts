import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

export const generateVehiclePDF = (vehicle: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Ficha do Veículo', 20, 20);
  
  autoTable(doc, {
    startY: 30,
    head: [['Campo', 'Valor']],
    body: [
      ['Marca', vehicle.brand || '-'],
      ['Modelo', vehicle.model || '-'],
      ['Placa', vehicle.plate || '-'],
      ['Ano', vehicle.year || '-'],
      ['Cor', vehicle.color || '-'],
      ['Categoria', vehicle.category || '-'],
      ['Status', vehicle.status || '-'],
      ['Valor de Aquisição', formatCurrency(vehicle.valor_aquisicao_sem_encargos)],
      ['Criado em', formatDate(vehicle.created_at)],
    ],
  });
  
  doc.save(`veiculo_${vehicle.plate || 'sem-placa'}.pdf`);
};

export const generateClientPDF = (client: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Ficha do Cliente', 20, 20);
  
  autoTable(doc, {
    startY: 30,
    head: [['Campo', 'Valor']],
    body: [
      ['Nome', client.name || '-'],
      ['Email', client.email || '-'],
      ['Telefone', client.phone || '-'],
      ['Documento', client.document || '-'],
      ['Criado em', formatDate(client.created_at)],
    ],
  });
  
  doc.save(`cliente_${client.name || 'sem-nome'}.pdf`);
};

export const generateContractPDF = (contract: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Contrato', 20, 20);
  
  autoTable(doc, {
    startY: 30,
    head: [['Campo', 'Valor']],
    body: [
      ['Cliente ID', contract.client_id || '-'],
      ['Veículo ID', contract.vehicle_id || '-'],
      ['Valor Total', formatCurrency(contract.total)],
      ['Data Início', formatDate(contract.start_date)],
      ['Meses', contract.months || '-'],
      ['Status', contract.status || '-'],
      ['Assinado em', formatDate(contract.signed_at)],
    ],
  });
  
  doc.save(`contrato_${contract.id}.pdf`);
};

export const generateTransactionPDF = (transaction: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Transação Financeira', 20, 20);
  
  autoTable(doc, {
    startY: 30,
    head: [['Campo', 'Valor']],
    body: [
      ['Descrição', transaction.description || '-'],
      ['Tipo', transaction.type || '-'],
      ['Valor', formatCurrency(transaction.amount)],
      ['Vencimento', formatDate(transaction.due_date)],
      ['Pago em', formatDate(transaction.paid_at)],
      ['Status', transaction.status || '-'],
      ['Previsão', transaction.forecast ? 'Sim' : 'Não'],
    ],
  });
  
  doc.save(`transacao_${transaction.id}.pdf`);
};
