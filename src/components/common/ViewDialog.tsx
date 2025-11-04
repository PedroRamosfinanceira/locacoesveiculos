import { Download, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface ViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any>;
  onDownloadPDF: () => void;
  onSendWhatsApp: (phoneNumber?: string) => void;
}

export function ViewDialog({
  open,
  onOpenChange,
  title,
  data,
  onDownloadPDF,
  onSendWhatsApp,
}: ViewDialogProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);

  const handleWhatsAppClick = () => {
    if (showWhatsappInput) {
      onSendWhatsApp(whatsappNumber);
      setWhatsappNumber('');
      setShowWhatsappInput(false);
    } else {
      setShowWhatsappInput(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-4">
              <Label className="font-semibold capitalize col-span-1">
                {key.replace(/_/g, ' ')}:
              </Label>
              <div className="col-span-2 text-muted-foreground">
                {value || '-'}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showWhatsappInput && (
            <Input
              placeholder="Número do WhatsApp (opcional)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="sm:max-w-xs"
            />
          )}
          <Button onClick={onDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleWhatsAppClick}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {showWhatsappInput ? 'Enviar' : 'WhatsApp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
