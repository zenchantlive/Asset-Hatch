/**
 * GenerateAllWarning Dialog Component
 * 
 * Warning dialog shown when user attempts to generate >5 assets at once.
 * Provides information about cost, time, and accuracy concerns.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface GenerateAllWarningProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    assetCount: number
    estimatedCost: number
    estimatedTime: string
}

export function GenerateAllWarning({
    isOpen,
    onClose,
    onConfirm,
    assetCount,
    estimatedCost,
    estimatedTime,
}: GenerateAllWarningProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[31.25rem] bg-black/95 border-yellow-500/50">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        </div>
                        <DialogTitle className="text-xl text-white">
                            Generate {assetCount} Assets?
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-white/70 space-y-3 pt-2">
                        <p>
                            You&apos;re about to generate <span className="text-yellow-500 font-semibold">{assetCount} assets</span> in batch mode.
                            Please review the following before proceeding:
                        </p>

                        <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Estimated Cost:</span>
                                <span className="text-white font-semibold">${estimatedCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Estimated Time:</span>
                                <span className="text-white font-semibold">{estimatedTime}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-white/80 font-medium">⚠️ Important Considerations:</p>
                            <ul className="text-sm space-y-1 text-white/60 list-disc list-inside">
                                <li>Large batches may take significant time to complete</li>
                                <li>API rate limits could slow down generation</li>
                                <li>All assets will require manual review and approval</li>
                                <li>Quality may vary across the batch</li>
                            </ul>
                        </div>

                        <p className="text-xs text-white/50 italic">
                            💡 Tip: For better results, consider generating assets in smaller batches or reviewing prompts individually first.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-white/5 hover:bg-white/10 text-white border-white/20"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="aurora-gradient font-semibold"
                    >
                        Proceed with Generation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
