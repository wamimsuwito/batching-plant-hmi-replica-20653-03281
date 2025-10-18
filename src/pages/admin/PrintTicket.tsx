import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Eye } from 'lucide-react';
import farikaLogo from '@/assets/farika-logo.png';

export interface TicketData {
  id?: string;
  jobOrder: string;
  nomorPO: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  namaPelanggan: string;
  lokasiProyek: string;
  mutuBeton: string;
  slump: string;
  volume: string;
  namaSopir: string;
  nomorMobil: string;
  nomorLambung: string;
  nomorRitasi: string;
  totalVolume: string;
  materials: {
    pasir: { target: number; realisasi: number; deviasi: number };
    batu: { target: number; realisasi: number; deviasi: number };
    semen: { target: number; realisasi: number; deviasi: number };
    air: { target: number; realisasi: number; deviasi: number };
  };
}

interface PrintTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketData: TicketData;
}

export function PrintTicketDialog({ open, onOpenChange, ticketData }: PrintTicketDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:p-0">
        <div className="p-6 print:p-8 print:w-full">
          {/* Header */}
          <div className="flex items-start gap-4 border-b-2 border-black pb-4 mb-4">
            <img src={farikaLogo} alt="PT Farika Logo" className="w-20 h-20" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">PT. FARIKA RIAU PERKASA</h1>
              <p className="text-sm italic">one stop concrete solution</p>
              <p className="text-sm font-semibold">READYMIX & PRECAST CONCRETE</p>
              <p className="text-xs mt-1">
                Jl. Soekarno Hatta Komp. SKA No. 62 E Pekanbaru Telp. (0761) 7090228 - 571662
              </p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-bold mb-4">BUKTI TIMBANG (BP-1)</h2>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {/* Left Column */}
            <div>
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Job Order</span>
                <span>: {ticketData.jobOrder}</span>
              </div>
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Nomor PO</span>
                <span>: {ticketData.nomorPO}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="font-semibold min-w-[120px]">Tanggal</span>
                <span>: {ticketData.tanggal}</span>
              </div>
              
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Nama Pelanggan</span>
                <span>: {ticketData.namaPelanggan}</span>
              </div>
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Lokasi Proyek</span>
                <span>: {ticketData.lokasiProyek}</span>
              </div>
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Mutu Beton</span>
                <span>: {ticketData.mutuBeton}</span>
              </div>
              <div className="flex gap-2 mb-1">
                <span className="font-semibold min-w-[120px]">Slump</span>
                <span>: {ticketData.slump}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[120px]">Volume</span>
                <span>: {ticketData.volume}</span>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="flex gap-2 mb-1 justify-end">
                <span className="font-semibold min-w-[120px]">Jam Mulai:</span>
                <span className="min-w-[100px]">{ticketData.jamMulai}</span>
              </div>
              <div className="flex gap-2 mb-3 justify-end">
                <span className="font-semibold min-w-[120px]">Jam Selesai:</span>
                <span className="min-w-[100px]">{ticketData.jamSelesai}</span>
              </div>
              
              <div className="flex gap-2 mb-1 justify-end">
                <span className="font-semibold min-w-[120px]">Nama Sopir</span>
                <span className="min-w-[100px]">: {ticketData.namaSopir}</span>
              </div>
              <div className="flex gap-2 mb-1 justify-end">
                <span className="font-semibold min-w-[120px]">Nomor Mobil</span>
                <span className="min-w-[100px]">: {ticketData.nomorMobil}</span>
              </div>
              <div className="flex gap-2 mb-1 justify-end">
                <span className="font-semibold min-w-[120px]">Nomor Lambung</span>
                <span className="min-w-[100px]">: {ticketData.nomorLambung}</span>
              </div>
              <div className="flex gap-2 mb-1 justify-end">
                <span className="font-semibold min-w-[120px]">Nomor Ritasi</span>
                <span className="min-w-[100px]">: {ticketData.nomorRitasi}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <span className="font-semibold min-w-[120px]">Total Volume</span>
                <span className="min-w-[100px]">: {ticketData.totalVolume}</span>
              </div>
            </div>
          </div>

          {/* Material Table */}
          <div className="mb-6">
            <h3 className="text-center text-sm font-semibold mb-2">Aktual penimbangan (Kg)</h3>
            <table className="w-full border border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="border-r border-black p-2 text-left">Material</th>
                  <th className="border-r border-black p-2 text-right">Target</th>
                  <th className="border-r border-black p-2 text-right">Realisasi</th>
                  <th className="p-2 text-right">Deviasi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2">Pasir</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.pasir.target}</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.pasir.realisasi}</td>
                  <td className="p-2 text-right">{ticketData.materials.pasir.deviasi}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2">Batu</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.batu.target}</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.batu.realisasi}</td>
                  <td className="p-2 text-right">{ticketData.materials.batu.deviasi}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2">Semen</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.semen.target}</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.semen.realisasi}</td>
                  <td className="p-2 text-right">{ticketData.materials.semen.deviasi}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2">Air</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.air.target}</td>
                  <td className="border-r border-black p-2 text-right">{ticketData.materials.air.realisasi}</td>
                  <td className="p-2 text-right">{ticketData.materials.air.deviasi}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
            <div className="text-center">
              <p className="mb-16">Penerima,</p>
              <p className="border-t border-black pt-1">(_____________________)</p>
            </div>
            <div className="text-center">
              <p className="mb-16">Operator,</p>
              <p className="border-t border-black pt-1">(_____________________)</p>
            </div>
            <div className="text-center">
              <p className="mb-16">Quality Control,</p>
              <p className="border-t border-black pt-1">(_____________________)</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs">
            <p>Dokumen ini dibuat secara otomatis oleh sistem.</p>
            <p>Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
          </div>

          {/* Print Button - Hidden when printing */}
          <div className="mt-6 flex justify-center gap-2 print:hidden">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Tiket
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PrintTicket() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    const saved = localStorage.getItem('production_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTickets(parsed);
      } catch (error) {
        console.error('Error loading tickets:', error);
      }
    }
  };

  const handleViewTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setPrintDialogOpen(true);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Print Tiket Produksi</CardTitle>
          <CardDescription>Daftar tiket produksi yang sudah dibuat</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada data tiket produksi</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Job Order</TableHead>
                  <TableHead>Jam Mulai</TableHead>
                  <TableHead>Jam Selesai</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Mutu Beton</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket, index) => (
                  <TableRow key={ticket.id || index}>
                    <TableCell>{ticket.tanggal}</TableCell>
                    <TableCell>{ticket.jobOrder}</TableCell>
                    <TableCell>{ticket.jamMulai}</TableCell>
                    <TableCell>{ticket.jamSelesai}</TableCell>
                    <TableCell>{ticket.namaPelanggan}</TableCell>
                    <TableCell>{ticket.mutuBeton}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTicket(ticket)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat & Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <PrintTicketDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          ticketData={selectedTicket}
        />
      )}
    </div>
  );
}
