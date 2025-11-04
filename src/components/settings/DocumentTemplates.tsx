import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const DocumentTemplates = () => {
  const { profile } = useAuth();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["doc-templates", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_doc_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  if (isLoading) {
    return <div>Carregando templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Templates de Documentos</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template: any) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tipo: {template.type}</p>
              <p className="text-sm text-muted-foreground">Versão: {template.version}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum template criado. Clique em "Novo Template" para começar.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
