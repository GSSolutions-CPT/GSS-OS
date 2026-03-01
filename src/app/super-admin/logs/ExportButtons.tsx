'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { getAllLogs } from './actions'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autotable types
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: unknown) => jsPDF
    }
}

export default function ExportButtons() {
    const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)

    async function handleExportCSV() {
        setIsExporting('csv')
        try {
            const logs = await getAllLogs()
            if (!logs || logs.length === 0) return

            const headers = ['Date', 'Time', 'Actor', 'Action', 'Details']
            const rows = logs.map((log: any) => {
                const actorName = Array.isArray(log.profiles)
                    ? (log.profiles[0] as { full_name?: string })?.full_name
                    : (log.profiles as { full_name?: string })?.full_name || 'System'

                return [
                    format(new Date(log.created_at), 'yyyy-MM-dd'),
                    format(new Date(log.created_at), 'HH:mm:ss'),
                    actorName,
                    log.action,
                    JSON.stringify(log.details).replace(/"/g, '""')
                ]
            })

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `nexus_audit_logs_${format(new Date(), 'yyyyMMdd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('CSV export failed', error)
            alert('Failed to export CSV')
        } finally {
            setIsExporting(null)
        }
    }

    async function handleExportPDF() {
        setIsExporting('pdf')
        try {
            const logs = await getAllLogs()
            if (!logs || logs.length === 0) return

            const doc = new jsPDF()

            // Add Logo/Header
            doc.setFontSize(20)
            doc.setTextColor(37, 99, 235) // primary color
            doc.text('NEXUS by GSS', 14, 22)

            doc.setFontSize(12)
            doc.setTextColor(100)
            doc.text('Global Audit Log Report', 14, 30)
            doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 38)

            const head = [['Date', 'Actor', 'Action', 'Details']]
            const body = logs.map((log: any) => {
                const actorName = Array.isArray(log.profiles)
                    ? (log.profiles[0] as { full_name?: string })?.full_name
                    : (log.profiles as { full_name?: string })?.full_name || 'System'

                return [
                    format(new Date(log.created_at), 'yyyy-MM-dd HH:mm'),
                    actorName,
                    log.action,
                    JSON.stringify(log.details)
                ]
            })

            doc.autoTable({
                startY: 45,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 8, overflow: 'linebreak' },
                columnStyles: { 3: { cellWidth: 80 } }
            })

            doc.save(`nexus_audit_logs_${format(new Date(), 'yyyyMMdd')}.pdf`)
        } catch (error) {
            console.error('PDF export failed', error)
            alert('Failed to export PDF')
        } finally {
            setIsExporting(null)
        }
    }

    return (
        <div className="flex gap-3">
            <button
                onClick={handleExportCSV}
                disabled={isExporting !== null}
                className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
            >
                {isExporting === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export CSV
            </button>
            <button
                onClick={handleExportPDF}
                disabled={isExporting !== null}
                className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
            >
                {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Export PDF
            </button>
        </div>
    )
}
