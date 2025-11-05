import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Car, ChevronLeft, ChevronRight, Calendar, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: string;
  mileage?: number;
  daily_rate?: number;
  monthly_rate?: number;
  image_url?: string;
}

export function VehicleCarousel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();
  const navigate = useNavigate();

  const fetchAvailableVehicles = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVehicles(data as any || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Erro ao carregar veículos',
        description: 'Não foi possível carregar os veículos disponíveis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % vehicles.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + vehicles.length) % vehicles.length);
  };

  const handleRentVehicle = (vehicleId: string) => {
    navigate(`/proposals?vehicle=${vehicleId}`);
  };

  if (loading) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl animate-pulse flex items-center justify-center">
        <Car className="h-12 w-12 text-blue-400 animate-bounce" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-none shadow-lg">
        <CardContent className="flex flex-col items-center justify-center h-80 text-center">
          <Car className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhum veículo disponível
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Adicione veículos ao sistema para começar a fazer locações
          </p>
          <Button onClick={() => navigate('/vehicles')}>
            Adicionar Veículo
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentVehicle = vehicles[currentIndex];
  const visibleVehicles = vehicles.slice(currentIndex, currentIndex + 3);
  
  // Se tiver menos de 3, pega do início
  if (visibleVehicles.length < 3) {
    visibleVehicles.push(...vehicles.slice(0, 3 - visibleVehicles.length));
  }

  return (
    <div className="w-full space-y-4">
      {/* Carrossel Principal */}
      <div className="relative">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl opacity-90" />
        
        {/* Conteúdo */}
        <div className="relative p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {visibleVehicles.map((vehicle, idx) => {
              const isMain = idx === 0;
              return (
                <Card
                  key={vehicle.id}
                  className={`${
                    isMain
                      ? 'lg:col-span-2 bg-white dark:bg-gray-900 shadow-2xl scale-105'
                      : 'bg-white/90 dark:bg-gray-900/90 shadow-lg'
                  } border-none transition-all duration-300 hover:scale-105 overflow-hidden`}
                >
                  <CardContent className="p-0">
                    {/* Imagem do veículo */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="h-20 w-20 text-gray-400" />
                        </div>
                      )}
                      <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                        Disponível
                      </Badge>
                    </div>

                    {/* Informações */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className={`${isMain ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {vehicle.year}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          {vehicle.mileage?.toLocaleString('pt-BR')} km
                        </div>
                        <Badge variant="outline">{vehicle.plate}</Badge>
                      </div>

                      {/* Preços */}
                      <div className="grid grid-cols-2 gap-4">
                        {vehicle.daily_rate && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Diária</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              R$ {vehicle.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        {vehicle.monthly_rate && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Mensal</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              R$ {vehicle.monthly_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Botão de ação */}
                      {isMain && (
                        <Button
                          onClick={() => handleRentVehicle(vehicle.id)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                          size="lg"
                        >
                          Alugar Agora
                        </Button>
                      )}
                      {!isMain && (
                        <Button
                          onClick={() => handleRentVehicle(vehicle.id)}
                          variant="outline"
                          className="w-full"
                        >
                          Ver Detalhes
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Controles de navegação */}
          {vehicles.length > 3 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                onClick={prevSlide}
                variant="ghost"
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white rounded-full h-12 w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Indicadores */}
              <div className="flex gap-2">
                {vehicles.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ir para slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextSlide}
                variant="ghost"
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white rounded-full h-12 w-12"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Botão para ver todos */}
      <div className="flex justify-center">
        <Button
          onClick={() => navigate('/vehicles')}
          variant="outline"
          size="lg"
          className="shadow-md"
        >
          Ver Todos os Veículos ({vehicles.length})
        </Button>
      </div>
    </div>
  );
}
