import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RevenueChartProps {
  data?: Array<{
    month: string;
    receitas: number;
    despesas: number;
    lucro: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  // Sample data if no data provided
  const chartData = data || [
    { month: 'Jan', receitas: 12500, despesas: 8000, lucro: 4500 },
    { month: 'Fev', receitas: 15200, despesas: 9200, lucro: 6000 },
    { month: 'Mar', receitas: 18400, despesas: 10100, lucro: 8300 },
    { month: 'Abr', receitas: 16800, despesas: 9500, lucro: 7300 },
    { month: 'Mai', receitas: 19500, despesas: 11000, lucro: 8500 },
    { month: 'Jun', receitas: 21200, despesas: 12000, lucro: 9200 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Evolução Financeira</CardTitle>
        <CardDescription>Receitas, Despesas e Lucro nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'white' }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  receitas: 'Receitas',
                  despesas: 'Despesas',
                  lucro: 'Lucro Líquido',
                };
                return labels[value] || value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="hsl(var(--success))" 
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="lucro" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
