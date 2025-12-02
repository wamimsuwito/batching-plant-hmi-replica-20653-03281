import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Eye } from 'lucide-react';
import defaultLogo from '@/assets/default-company-logo.png';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export interface TicketData {
  id?: string;
  jobOrder: string;
  productionType?: 'AUTO' | 'MANUAL';
  serialNumber?: string;
  operatorName?: string;
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
    pasir1?: { target: number; realisasi: number; deviasi: number };
    pasir2?: { target: number; realisasi: number; deviasi: number };
    batu1?: { target: number; realisasi: number; deviasi: number };
    batu2?: { target: number; realisasi: number; deviasi: number };
    pasir?: { target: number; realisasi: number; deviasi: number };
    batu?: { target: number; realisasi: number; deviasi: number };
    semen: { target: number; realisasi: number; deviasi: number };
    air: { target: number; realisasi: number; deviasi: number };
  };
  aggregateNote?: {
    pasir1?: string;
    pasir2?: string;
    batu1?: string;
    batu2?: string;
  };
}

interface PrintTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketData: TicketData;
}

export function PrintTicketDialog({ open, onOpenChange, ticketData }: PrintTicketDialogProps) {
  const { companySettings } = useCompanySettings();
  
  const handlePrint = () => {
    window.print();
  };

  // Extract BP code from serial number (e.g., "PKU-BP#1-0000002" → "BP#1")
  const extractBPCode = (serialNumber?: string) => {
    if (!serialNumber) return 'BP#1';
    const match = serialNumber.match(/BP#\d+/);
    return match ? match[0] : 'BP#1';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:h-auto">
        <DialogTitle className="sr-only">Tiket Produksi</DialogTitle>
        <div className="bg-white text-black p-4 print:p-4">
          {/* Header */}
          <div className="flex items-center gap-3 border-b-[3px] border-black pb-2 mb-3 print:pb-2 print:mb-2">
            <img 
              src={companySettings.logo || defaultLogo} 
              alt={`${companySettings.name} Logo`}
              className="w-16 h-16 print:w-14 print:h-14"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
            <div className="flex-1">
              <h1 className="text-lg print:text-base font-bold">{companySettings.name}</h1>
              <p className="text-xs print:text-[10px] font-semibold">{companySettings.tagline}</p>
              <p className="text-[10px] print:text-[9px] mt-0.5">
                {companySettings.address} Telp. {companySettings.phone}
              </p>
            </div>
            {ticketData.serialNumber && (
              <div className="text-right">
                <div className="text-[10px] print:text-[9px] font-semibold text-gray-600">No. Seri:</div>
                <div className="text-sm print:text-xs font-bold">{ticketData.serialNumber}</div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-center text-base print:text-sm font-bold mb-3 print:mb-2 bg-gray-100 py-1.5 print:py-1">
            BUKTI TIMBANG ({extractBPCode(ticketData.serialNumber)})
            {ticketData.productionType && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                ticketData.productionType === 'MANUAL' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}>
                {ticketData.productionType}
              </span>
            )}
          </h2>

          {/* Info Grid - 2 Columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3 print:mb-2 text-xs print:text-[11px]">
            <div className="space-y-0.5">
              <div className="flex"><span className="font-semibold w-28">Tanggal</span><span>: {ticketData.tanggal}</span></div>
              <div className="flex"><span className="font-semibold w-28">Nama Pelanggan</span><span>: {ticketData.namaPelanggan || '-'}</span></div>
              <div className="flex"><span className="font-semibold w-28">Lokasi Proyek</span><span>: {ticketData.lokasiProyek || '-'}</span></div>
              <div className="flex"><span className="font-semibold w-28">Mutu Beton</span><span>: {ticketData.mutuBeton || '-'}</span></div>
              <div className="flex"><span className="font-semibold w-28">Slump</span><span>: {ticketData.slump || '-'}</span></div>
              <div className="flex"><span className="font-semibold w-28">Volume</span><span>: {ticketData.volume || '-'}</span></div>
            </div>
            <div className="space-y-0.5">
              <div className="flex"><span className="font-semibold w-28">Jam Mulai</span><span>: {ticketData.jamMulai}</span></div>
              <div className="flex"><span className="font-semibold w-28">Jam Selesai</span><span>: {ticketData.jamSelesai}</span></div>
              <div className="flex"><span className="font-semibold w-28">Nama Sopir</span><span>: {ticketData.namaSopir || '-'}</span></div>
              <div className="flex"><span className="font-semibold w-28">Nomor Mobil</span><span>: {ticketData.nomorMobil || '-'}</span></div>
            </div>
          </div>

          {/* Material Table */}
          <div className="mb-3 print:mb-2">
            <h3 className="text-center text-xs print:text-[10px] font-semibold mb-1.5 print:mb-1">
              Aktual penimbangan (Kg)
            </h3>
            <table className="w-full border-[2.5px] border-black text-xs print:text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-[2.5px] border-black p-1.5 print:p-1 text-left font-bold">Material</th>
                  <th className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold">Target</th>
                  <th className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold">Realisasi</th>
                  <th className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold">Deviasi</th>
                </tr>
              </thead>
              <tbody>
                {/* Pasir 1 */}
                {ticketData.materials.pasir1 && (
                  <tr>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">
                      Pasir 1
                      {ticketData.aggregateNote?.pasir1 && (
                        <div className="text-xs text-gray-600 italic">({ticketData.aggregateNote.pasir1})</div>
                      )}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.pasir1.target.toFixed(0)}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.pasir1.realisasi.toFixed(0)}
                    </td>
                    <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                      ticketData.materials.pasir1.deviasi < 0 ? 'text-red-600' : 
                      ticketData.materials.pasir1.deviasi > 0 ? 'text-green-600' : ''
                    }`}>
                      {ticketData.materials.pasir1.deviasi > 0 ? '+' : ''}{ticketData.materials.pasir1.deviasi.toFixed(0)}
                    </td>
                  </tr>
                )}

                {/* Pasir 2 */}
                {ticketData.materials.pasir2 && (
                  <tr>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">
                      Pasir 2
                      {ticketData.aggregateNote?.pasir2 && (
                        <div className="text-xs text-gray-600 italic">({ticketData.aggregateNote.pasir2})</div>
                      )}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.pasir2.target.toFixed(0)}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.pasir2.realisasi.toFixed(0)}
                    </td>
                    <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                      ticketData.materials.pasir2.deviasi < 0 ? 'text-red-600' : 
                      ticketData.materials.pasir2.deviasi > 0 ? 'text-green-600' : ''
                    }`}>
                      {ticketData.materials.pasir2.deviasi > 0 ? '+' : ''}{ticketData.materials.pasir2.deviasi.toFixed(0)}
                    </td>
                  </tr>
                )}

                {/* Batu 1 */}
                {ticketData.materials.batu1 && (
                  <tr>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">
                      Batu 1
                      {ticketData.aggregateNote?.batu1 && (
                        <div className="text-xs text-gray-600 italic">({ticketData.aggregateNote.batu1})</div>
                      )}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.batu1.target.toFixed(0)}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.batu1.realisasi.toFixed(0)}
                    </td>
                    <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                      ticketData.materials.batu1.deviasi < 0 ? 'text-red-600' : 
                      ticketData.materials.batu1.deviasi > 0 ? 'text-green-600' : ''
                    }`}>
                      {ticketData.materials.batu1.deviasi > 0 ? '+' : ''}{ticketData.materials.batu1.deviasi.toFixed(0)}
                    </td>
                  </tr>
                )}

                {/* Batu 2 */}
                {ticketData.materials.batu2 && (
                  <tr>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">
                      Batu 2
                      {ticketData.aggregateNote?.batu2 && (
                        <div className="text-xs text-gray-600 italic">({ticketData.aggregateNote.batu2})</div>
                      )}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.batu2.target.toFixed(0)}
                    </td>
                    <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                      {ticketData.materials.batu2.realisasi.toFixed(0)}
                    </td>
                    <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                      ticketData.materials.batu2.deviasi < 0 ? 'text-red-600' : 
                      ticketData.materials.batu2.deviasi > 0 ? 'text-green-600' : ''
                    }`}>
                      {ticketData.materials.batu2.deviasi > 0 ? '+' : ''}{ticketData.materials.batu2.deviasi.toFixed(0)}
                    </td>
                  </tr>
                )}


                {/* Semen */}
                <tr>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">Semen</td>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                    {ticketData.materials.semen.target.toFixed(0)}
                  </td>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                    {ticketData.materials.semen.realisasi.toFixed(0)}
                  </td>
                  <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                    ticketData.materials.semen.deviasi < 0 ? 'text-red-600' : 
                    ticketData.materials.semen.deviasi > 0 ? 'text-green-600' : ''
                  }`}>
                    {ticketData.materials.semen.deviasi > 0 ? '+' : ''}{ticketData.materials.semen.deviasi.toFixed(0)}
                  </td>
                </tr>

                {/* Air */}
                <tr>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 font-semibold">Air</td>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                    {ticketData.materials.air.target.toFixed(0)}
                  </td>
                  <td className="border-[2.5px] border-black p-1.5 print:p-1 text-center font-medium">
                    {ticketData.materials.air.realisasi.toFixed(0)}
                  </td>
                  <td className={`border-[2.5px] border-black p-1.5 print:p-1 text-center font-bold ${
                    ticketData.materials.air.deviasi < 0 ? 'text-red-600' : 
                    ticketData.materials.air.deviasi > 0 ? 'text-green-600' : ''
                  }`}>
                    {ticketData.materials.air.deviasi > 0 ? '+' : ''}{ticketData.materials.air.deviasi.toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures - 3 Columns */}
          <div className="grid grid-cols-3 gap-4 print:gap-3 mb-2 print:mb-1.5 signature-section">
            <div className="text-center">
              <p className="text-xs print:text-[10px] mb-12 print:mb-10 font-semibold">Penerima,</p>
              <div className="border-t border-black pt-1 w-32 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="text-xs print:text-[10px] mb-12 print:mb-10 font-semibold">Operator,</p>
              <div className="border-t border-black pt-1 w-32 mx-auto">
                {ticketData.operatorName && (
                  <p className="text-xs print:text-[10px] font-medium mt-1">{ticketData.operatorName}</p>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs print:text-[10px] mb-12 print:mb-10 font-semibold">Quality Control,</p>
              <div className="border-t border-black pt-1 w-32 mx-auto"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] print:text-[9px] text-gray-600 border-t border-gray-300 pt-1.5 print:pt-1">
            <p>Dokumen ini dibuat secara otomatis oleh sistem.</p>
            <p>Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
          </div>

          {/* Print Button - Hidden when printing */}
          <div className="mt-4 flex justify-center gap-2 print:hidden">
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
    <div className="p-6 print:hidden">
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
