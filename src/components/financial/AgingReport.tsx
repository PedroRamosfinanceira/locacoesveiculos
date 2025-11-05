import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AgingData {
  tenant_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  transaction_id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  days_overdue: number;
  aging_bucket: string;
  criticality: number;
}

export const AgingReport = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: agingData = [], isLoading } = useQuery({
    queryKey: ["aging-report", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_v_aging")
        .select("*")
        .order("days_overdue", { ascending: false });

      if (error) throw error;
      return data as AgingData[];
    },
    enabled: !!profile?.tenant_id,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ phone, clientName, amount }: { phone: string; clientName: string; amount: number }) => {
      const message = `Olá ${clientName}, este é um lembrete sobre o pagamento pendente de R$ ${amount.toFixed(2)}. Por favor, regularize sua situação.`;
      
      const { error } = await supabase.rpc("locacoes_veicular_wa_send_sql", {
        p_tenant: profile?.tenant_id,
        p_to: phone,
        p_text: message,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Cobrança enviada",
        description: "Mensagem de cobrança enviada via WhatsApp",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar cobrança",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCriticalityBadge = (criticality: number) => {
    const variants = {
      1: { label: "0-30 dias", variant: "default" as const },
      2: { label: "31-60 dias", variant: "secondary" as const },
      3: { label: "61-90 dias", variant: "destructive" as const },
      4: { label: "+90 dias", variant: "destructive" as const },
    };
    const config = variants[criticality as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const groupedData = agingData.reduce((acc, item) => {
    if (!acc[item.client_id]) {
      acc[item.client_id] = {
        client_name: item.client_name,
        client_phone: item.client_phone,
        total_amount: 0,
        max_criticality: 0,
        transactions: [],
      };
    }
    acc[item.client_id].total_amount += item.amount;
    acc[item.client_id].max_criticality = Math.max(acc[item.client_id].max_criticality, item.criticality);
    acc[item.client_id].transactions.push(item);
    return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>);

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando relatório de aging...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((criticality) => {
          const items = agingData.filter((item) => item.criticality === criticality);
          const total = items.reduce((sum, item) => sum + item.amount, 0);
          const labels = ["0-30 dias", "31-60 dias", "61-90 dias", "+90 dias"];

          return (
            <Card key={criticality}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{labels[criticality - 1]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(total)}</div>
                <p className="text-xs text-muted-foreground">{items.length} transações</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {Object.entries(groupedData).map(([clientId, data]: [string, any]) => (
          <Card key={clientId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{data.client_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{data.client_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getCriticalityBadge(data.max_criticality)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      sendReminderMutation.mutate({
                        phone: data.client_phone,
                        clientName: data.client_name,
                        amount: data.total_amount,
                      })
                    }
                    disabled={sendReminderMutation.isPending}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar Cobrança
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Total em atraso:</span>
                  <span className="font-bold text-destructive">{formatCurrency(data.total_amount)}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {data.transactions.map((tx: AgingData) => (
                    <div key={tx.transaction_id} className="flex justify-between text-sm border-t pt-2">
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.days_overdue} dias de atraso</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedData).length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma inadimplência encontrada
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
