import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface SellVehicleDialogProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    valor_aquisicao_sem_encargos: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const SellVehicleDialog = ({ vehicle, isOpen, onClose }: SellVehicleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saleValue, setSaleValue] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [quitInstallments, setQuitInstallments] = useState(false);

  const sellMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("locacoes_veicular_sell_vehicle", {
        p_vehicle_id: vehicle.id,
        p_sale_value: parseFloat(saleValue),
        p_sale_date: saleDate,
        p_quit_installments: quitInstallments,
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      const gainLoss = data.gain_loss as number;
      const isProfit = gainLoss > 0;

      toast({
        title: "Veículo vendido com sucesso",
        description: isProfit 
          ? `Ganho de capital: R$ ${Math.abs(gainLoss).toFixed(2)}`
          : `Perda de capital: R$ ${Math.abs(gainLoss).toFixed(2)}`,
      });
      
      onClose();
      setSaleValue("");
      setSaleDate(new Date().toISOString().split('T')[0]);
      setQuitInstallments(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao vender veículo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const estimatedGainLoss = saleValue 
    ? parseFloat(saleValue) - (vehicle.valor_aquisicao_sem_encargos || 0)
    : 0;

  const isProfit = estimatedGainLoss > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Veículo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
            <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor de Aquisição:</span>
              <span className="font-semibold">
                R$ {(vehicle.valor_aquisicao_sem_encargos || 0).toFixed(2)}
              </span>
            </div>
            {saleValue && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Ganho/Perda Estimado:</span>
                <div className="flex items-center gap-1">
                  {isProfit ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {Math.abs(estimatedGainLoss).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleValue">Valor de Venda</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="saleValue"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={saleValue}
                onChange={(e) => setSaleValue(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleDate">Data da Venda</Label>
            <Input
              id="saleDate"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="quitInstallments"
              checked={quitInstallments}
              onCheckedChange={(checked) => setQuitInstallments(checked as boolean)}
            />
            <Label htmlFor="quitInstallments" className="text-sm cursor-pointer">
              Quitar todas as parcelas pendentes
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => sellMutation.mutate()}
              disabled={!saleValue || sellMutation.isPending}
              className="flex-1"
            >
              {sellMutation.isPending ? "Vendendo..." : "Confirmar Venda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
