# 🧮 AUTOMAÇÕES DE CÁLCULO IMPLEMENTADAS

## ✅ O QUE FOI ADICIONADO

Implementei **cálculos automáticos inteligentes** no `VehicleInvestmentWizard` para automatizar completamente a análise de viabilidade de aquisição de veículos!

## 🎯 CÁLCULOS AUTOMÁTICOS

### 1. **Depreciação Mensal** 📉
- **Fórmula:** `Valor de Aquisição / (Vida Útil em Anos × 12)`
- **Padrão:** 5 anos de vida útil
- **Método:** Depreciação linear
- **Exibição:** Card roxo com valor mensal calculado

### 2. **Aluguel Mensal Sugerido** 💰
- **Fórmula:** `(Custo Total Mensal × Margem de Lucro) / Taxa de Ocupação`
- **Margem padrão:** 30% (1.3x)
- **Taxa de ocupação:** 80% (0.8)
- **Exibição:** Card verde com valor sugerido

### 3. **Break-Even (Ponto de Equilíbrio)** ⏱️
- **Fórmula:** `Valor de Aquisição / Receita Líquida Mensal`
- **Considera:**
  - Receita de aluguel × ocupação
  - Despesas mensais
  - Financiamento (se houver)
  - Depreciação
- **Exibição:** Card laranja com meses para recuperar investimento

### 4. **ROI Anual Projetado** 📈
- **Fórmula:** `(Receita Líquida Anual / Valor de Aquisição) × 100`
- **Base:** 12 meses de operação
- **Exibição:** Card azul com percentual de retorno

### 5. **Custo Total Mensal** 💸
- **Componentes:**
  - Despesas (IPVA + Seguro + Licenciamento) / 12
  - Parcela de financiamento (se aplicável)
  - Depreciação mensal
- **Exibição:** Card cinza com detalhamento completo

## 🎨 INTERFACE VISUAL

### Cards de Cálculo:
```
┌─────────────────────────────────────────┐
│ 💜 Depreciação Mensal                  │
│ R$ 833,33                               │
│ Linear por 5 anos                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💚 Aluguel Mensal Sugerido             │
│ R$ 2.500,00                             │
│ 30% margem + 80% ocupação               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🧡 Break-Even                           │
│ 36 meses                                │
│ Tempo para recuperar investimento       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💙 ROI Anual Projetado                  │
│ 18.5%                                   │
│ Retorno sobre investimento              │
└─────────────────────────────────────────┘
```

### Preview no Step 1:
- **Alerta azul** mostrando sugestão rápida de aluguel
- Aparece automaticamente ao informar valor de aquisição
- Dá preview imediato da viabilidade

### Painel Completo no Step 3:
- **4 cards coloridos** com métricas principais
- **Card de detalhamento** de custos mensais
- **Alerta informativo** explicando os cálculos
- **Atualização em tempo real** conforme dados mudam

## 🔧 CONFIGURAÇÕES AJUSTÁVEIS

```typescript
const config = {
  vidaUtilAnos: 5,      // Vida útil para depreciação
  margemLucro: 1.3,     // 30% de margem
  taxaOcupacao: 0.8,    // 80% de ocupação média
};
```

Esses valores podem ser facilmente ajustados no código se necessário!

## 📊 EXEMPLO PRÁTICO

**Cenário:**
- Veículo: R$ 50.000,00
- IPVA: R$ 2.000/ano
- Seguro: R$ 3.000/ano
- Licenciamento: R$ 200/ano
- Financiamento: R$ 1.000/mês

**Cálculos Automáticos:**
```
Depreciação Mensal: R$ 833,33
  → R$ 50.000 / 60 meses

Despesas Mensais: R$ 433,33
  → (R$ 2.000 + R$ 3.000 + R$ 200) / 12

Custo Total Mensal: R$ 2.266,66
  → R$ 433,33 + R$ 1.000 + R$ 833,33

Aluguel Sugerido: R$ 3.686,66
  → (R$ 2.266,66 × 1.3) / 0.8

Receita Líquida Mensal: R$ 1.282,66
  → (R$ 3.686,66 × 0.8) - R$ 433,33 - R$ 1.000

Break-Even: 39 meses
  → R$ 50.000 / R$ 1.282,66

ROI Anual: 30.8%
  → (R$ 1.282,66 × 12 / R$ 50.000) × 100
```

## ✨ BENEFÍCIOS

### Para o Usuário:
- ✅ **Decisão informada** sobre viabilidade da aquisição
- ✅ **Preço de aluguel** calculado automaticamente
- ✅ **Projeção de retorno** antes de investir
- ✅ **Sem planilhas externas** necessárias

### Para o Negócio:
- ✅ **Padronização** de preços de aluguel
- ✅ **Redução de erros** em cálculos manuais
- ✅ **Análise de viabilidade** em tempo real
- ✅ **Documentação automática** da lógica de precificação

## 🚀 COMO USAR

1. **Acesse:** Veículos → Novo Veículo
2. **Passo 1:** Informe valor de aquisição
   - Veja preview de aluguel sugerido
3. **Passo 2:** Escolha forma de pagamento
   - À vista ou financiado
4. **Passo 3:** Informe despesas anuais
   - **BOOM!** 💥 Veja todos os cálculos automaticamente:
     - 4 cards com métricas principais
     - Detalhamento completo de custos
     - ROI e break-even calculados

## 🎓 METODOLOGIA

### Depreciação Linear:
Método mais simples e comum. Assume perda de valor constante ao longo do tempo.

### Margem de Lucro:
30% sobre custos é uma margem saudável para locação de veículos, considerando:
- Manutenções não planejadas
- Períodos de ociosidade
- Desgaste acelerado

### Taxa de Ocupação:
80% é uma estimativa conservadora considerando:
- Manutenções programadas
- Limpeza entre locações
- Sazonalidade da demanda

## 📈 PRÓXIMAS MELHORIAS POSSÍVEIS

### Futuras Automações:
- [ ] **Integração FIPE API** para buscar valor de mercado automaticamente
- [ ] **Simulador de cenários** (otimista, realista, pessimista)
- [ ] **Gráfico de projeção** de receita ao longo do tempo
- [ ] **Comparação com veículos similares** no banco
- [ ] **Alertas de viabilidade** (ROI muito baixo, break-even muito longo)
- [ ] **Histórico de preços** de aluguel por categoria
- [ ] **Calculadora de margem** ajustável na interface

---

**Desenvolvido com ❤️ e 🧮 em 04/11/2025**
