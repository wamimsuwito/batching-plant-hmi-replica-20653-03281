import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AggregateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (notes: {
    pasir1?: string;
    pasir2?: string;
    batu1?: string;
    batu2?: string;
  }) => void;
  currentNotes?: {
    pasir1?: string;
    pasir2?: string;
    batu1?: string;
    batu2?: string;
  };
}

export function AggregateNoteDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  currentNotes 
}: AggregateNoteDialogProps) {
  const [notes, setNotes] = useState(currentNotes || {});

  useEffect(() => {
    if (open) {
      setNotes(currentNotes || {});
    }
  }, [open, currentNotes]);

  const handleSave = () => {
    onSave(notes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Query Aggregate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pasir1">Pasir 1</Label>
            <Input
              id="pasir1"
              placeholder="e.g., Pasir Galunggung"
              value={notes.pasir1 || ''}
              onChange={(e) => setNotes({ ...notes, pasir1: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pasir2">Pasir 2</Label>
            <Input
              id="pasir2"
              placeholder="e.g., Pasir Sungai"
              value={notes.pasir2 || ''}
              onChange={(e) => setNotes({ ...notes, pasir2: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="batu1">Batu 1</Label>
            <Input
              id="batu1"
              placeholder="e.g., Batu Split 1-2"
              value={notes.batu1 || ''}
              onChange={(e) => setNotes({ ...notes, batu1: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="batu2">Batu 2</Label>
            <Input
              id="batu2"
              placeholder="e.g., Batu Split 2-3"
              value={notes.batu2 || ''}
              onChange={(e) => setNotes({ ...notes, batu2: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
