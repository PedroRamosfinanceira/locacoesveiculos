import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface VehicleStatusChartProps {
  alugados?: number;
  disponiveis?: number;
  manutencao?: number;
}

export const VehicleStatusChart = ({ alugados = 0, disponiveis = 0, manutencao = 0 }: VehicleStatusChartProps) => {
  const data = [
    { name: 'Alugados', value: alugados || 12, color: 'hsl(var(--success))' },
    { name: 'Disponíveis', value: disponiveis || 8, color: 'hsl(var(--warning))' },
    { name: 'Manutenção', value: manutencao || 3, color: 'hsl(var(--destructive))' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Status da Frota</CardTitle>
        <CardDescription>Distribuição de {total} veículos por status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                `${value} veículos (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary badges */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-3 rounded-lg glass">
            <div className="text-2xl font-bold text-success">{data[0].value}</div>
            <div className="text-xs text-muted-foreground">Alugados</div>
          </div>
          <div className="text-center p-3 rounded-lg glass">
            <div className="text-2xl font-bold text-warning">{data[1].value}</div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </div>
          <div className="text-center p-3 rounded-lg glass">
            <div className="text-2xl font-bold text-destructive">{data[2].value}</div>
            <div className="text-xs text-muted-foreground">Manutenção</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
