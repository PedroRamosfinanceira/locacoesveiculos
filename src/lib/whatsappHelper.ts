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

export const sendVehicleWhatsApp = (vehicle: any, phoneNumber?: string) => {
  const message = `
🚗 *Detalhes do Veículo*

📌 Marca: ${vehicle.brand || '-'}
📌 Modelo: ${vehicle.model || '-'}
📌 Placa: ${vehicle.plate || '-'}
📌 Ano: ${vehicle.year || '-'}
📌 Cor: ${vehicle.color || '-'}
📌 Categoria: ${vehicle.category || '-'}
📌 Status: ${vehicle.status || '-'}
💰 Valor: ${formatCurrency(vehicle.valor_aquisicao_sem_encargos)}
  `.trim();
  
  const encodedMessage = encodeURIComponent(message);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};

export const sendClientWhatsApp = (client: any, phoneNumber?: string) => {
  const message = `
👤 *Detalhes do Cliente*

📌 Nome: ${client.name || '-'}
📧 Email: ${client.email || '-'}
📞 Telefone: ${client.phone || '-'}
📄 Documento: ${client.document || '-'}
📅 Cadastrado em: ${formatDate(client.created_at)}
  `.trim();
  
  const encodedMessage = encodeURIComponent(message);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};

export const sendContractWhatsApp = (contract: any, phoneNumber?: string) => {
  const message = `
📄 *Detalhes do Contrato*

📌 Status: ${contract.status || '-'}
💰 Valor Total: ${formatCurrency(contract.total)}
📅 Data Início: ${formatDate(contract.start_date)}
📅 Meses: ${contract.months || '-'}
✍️ Assinado em: ${formatDate(contract.signed_at)}
  `.trim();
  
  const encodedMessage = encodeURIComponent(message);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};

export const sendTransactionWhatsApp = (transaction: any, phoneNumber?: string) => {
  const message = `
💰 *Transação Financeira*

📝 Descrição: ${transaction.description || '-'}
📊 Tipo: ${transaction.type || '-'}
💵 Valor: ${formatCurrency(transaction.amount)}
📅 Vencimento: ${formatDate(transaction.due_date)}
✅ Pago em: ${formatDate(transaction.paid_at)}
🔖 Status: ${transaction.status || '-'}
  `.trim();
  
  const encodedMessage = encodeURIComponent(message);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};
