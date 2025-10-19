import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";

interface ActivationDialogProps {
  open: boolean;
  onActivationSuccess: () => void;
}

export function ActivationDialog({ open, onActivationSuccess }: ActivationDialogProps) {
  const [hardwareId, setHardwareId] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open && window.licensing) {
      // Get hardware ID when dialog opens
      window.licensing.getHardwareId().then((id: string) => {
        setHardwareId(id || 'Error reading Hardware ID');
      });
    }
  }, [open]);

  const copyHardwareId = () => {
    navigator.clipboard.writeText(hardwareId);
    toast.success('Hardware ID copied to clipboard!');
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    if (!licenseKey.startsWith('LISA-')) {
      setError('Invalid license key format. Key must start with LISA-');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await window.licensing.saveLicense(licenseKey.trim());
      
      if (result.success) {
        toast.success('License activated successfully!', {
          description: `Valid until: ${new Date(result.expiryDate).toLocaleDateString('id-ID')}`
        });
        onActivationSuccess();
      } else {
        setError(result.error || 'Failed to activate license');
        toast.error('Activation failed', {
          description: result.error
        });
      }
    } catch (err) {
      setError('Failed to activate license. Please try again.');
      toast.error('Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleActivate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-6 h-6 text-primary" />
            Software Activation Required
          </DialogTitle>
          <DialogDescription className="text-base">
            Please activate this software with a valid license key to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hardware ID Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hardware ID</Label>
            <div className="flex gap-2">
              <Input
                value={hardwareId}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyHardwareId}
                title="Copy Hardware ID"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this Hardware ID to PT Farika to get your license key
            </p>
          </div>

          {/* License Key Input */}
          <div className="space-y-2">
            <Label htmlFor="license-key" className="text-sm font-medium">
              License Key
            </Label>
            <Input
              id="license-key"
              placeholder="LISA-XXXXX-XXXXX-XXXXX-XXXXX"
              value={licenseKey}
              onChange={(e) => {
                setLicenseKey(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className="font-mono text-sm"
              disabled={loading}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Need a license key?</p>
            <p className="text-xs text-muted-foreground">
              Contact PT Farika Riau Perkasa Indonesia:
            </p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>📱 WhatsApp: 081271963847</p>
              <p>📧 Email: farika@example.com</p>
            </div>
          </div>
        </div>

        {/* Activate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim()}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
