import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Search } from 'lucide-react';

interface ProductionRecord {
  id: string;
  timestamp: string;
  mixingNumber: number;
  totalMixings: number;
  materials: {
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    semen: number;
    air: number;
    additive: number;
  };
  mixingTime: number;
  status: 'completed' | 'failed';
}

export default function ProductionDatabase() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ProductionRecord[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Load production records from localStorage
  useEffect(() => {
    loadRecords();
  }, []);

  // Filter records when search date changes
  useEffect(() => {
    if (searchDate) {
      const filtered = records.filter(record => 
        record.timestamp.startsWith(searchDate)
      );
      setFilteredRecords(filtered);
      setCurrentPage(1);
    } else {
      setFilteredRecords(records);
    }
  }, [searchDate, records]);

  const loadRecords = () => {
    const allRecords: ProductionRecord[] = [];
    
    // Load all production history from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('productionHistory_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              allRecords.push(...parsed);
            }
          }
        } catch (error) {
          console.error('Error loading records:', error);
        }
      }
    }
    
    // Sort by timestamp descending (newest first)
    allRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setRecords(allRecords);
    setFilteredRecords(allRecords);
  };

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Helper function to escape CSV values properly
    const escapeCSV = (value: any): string => {
      const str = String(value);
      // If value contains comma, newline, or double quotes, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Timestamp',
      'Mixing',
      'Total Mixing',
      'Pasir 1 (kg)',
      'Pasir 2 (kg)',
      'Batu 1 (kg)',
      'Batu 2 (kg)',
      'Semen (kg)',
      'Air (kg)',
      'Additive (kg)',
      'Waktu Mixing (s)',
      'Status'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...filteredRecords.map(record => {
        // Create array of values in exact order as headers
        const row = [
          escapeCSV(record.timestamp),
          escapeCSV(record.mixingNumber),
          escapeCSV(record.totalMixings),
          escapeCSV(record.materials.pasir1 || 0),
          escapeCSV(record.materials.pasir2 || 0),
          escapeCSV(record.materials.batu1 || 0),
          escapeCSV(record.materials.batu2 || 0),
          escapeCSV(record.materials.semen || 0),
          escapeCSV(record.materials.air || 0),
          escapeCSV(record.materials.additive || 0),
          escapeCSV(record.mixingTime),
          escapeCSV(record.status)
        ];
        return row.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');

    // Add BOM (Byte Order Mark) for Excel UTF-8 recognition
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `production_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Produksi</CardTitle>
          <CardDescription>Riwayat dan data produksi batching plant</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Filter berdasarkan tanggal"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={loadRecords} variant="outline" className="gap-2">
              Refresh
            </Button>
          </div>

          {/* Records Table */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada data produksi</p>
              <p className="text-sm">Data akan muncul setelah produksi selesai</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-center">Mixing</TableHead>
                      <TableHead className="text-right">Pasir 1</TableHead>
                      <TableHead className="text-right">Pasir 2</TableHead>
                      <TableHead className="text-right">Batu 1</TableHead>
                      <TableHead className="text-right">Batu 2</TableHead>
                      <TableHead className="text-right">Semen</TableHead>
                      <TableHead className="text-right">Air</TableHead>
                      <TableHead className="text-right">Additive</TableHead>
                      <TableHead className="text-center">Waktu (s)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(record.timestamp)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {record.mixingNumber}/{record.totalMixings}
                        </TableCell>
                        <TableCell className="text-right">{record.materials.pasir1.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.pasir2.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.batu1.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.batu2.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.semen.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.air.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.materials.additive.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{record.mixingTime}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {record.status === 'completed' ? 'Selesai' : 'Gagal'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, filteredRecords.length)} dari {filteredRecords.length} data
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
