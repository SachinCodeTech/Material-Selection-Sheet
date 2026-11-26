'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('ellipsis');
  }

  for (let p = start; p <= end; p++) {
    pages.push(p);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [6, 10, 20, 50],
  itemLabel = 'items',
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);
  const pageNumbers = getVisiblePageNumbers(safePage, totalPages);

  const handleSelectPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    onPageChange(clamped);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 sm:px-6 border-t border-border/70 bg-muted/20"
      role="navigation"
      aria-label="Pagination"
    >
      {/* Left: Range summary + optional rows per page */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground tabular-nums">
        <span>
          Showing <span className="font-semibold text-foreground">{startIndex}–{endIndex}</span> of{' '}
          <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-border" aria-hidden="true">·</span>
            <span>Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger
                aria-label="Items per page"
                className="h-8 w-[68px] text-xs bg-white border-border tabular-nums"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs tabular-nums">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Page Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleSelectPage(1)}
            disabled={safePage <= 1}
            aria-label="First page"
            className="hidden sm:inline-flex h-9 w-9 bg-white border-border"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSelectPage(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="h-9 px-2.5 gap-1 bg-white border-border text-xs font-medium whitespace-nowrap"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Prev</span>
          </Button>

          <div className="flex items-center gap-1 px-0.5">
            {pageNumbers.map((entry, idx) =>
              entry === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-muted-foreground select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={entry}
                  type="button"
                  variant={entry === safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectPage(entry)}
                  aria-current={entry === safePage ? 'page' : undefined}
                  className={`h-9 min-w-[36px] px-2.5 text-xs font-semibold tabular-nums ${
                    entry === safePage
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
                      : 'bg-white border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {entry}
                </Button>
              )
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSelectPage(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="h-9 px-2.5 gap-1 bg-white border-border text-xs font-medium whitespace-nowrap"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleSelectPage(totalPages)}
            disabled={safePage >= totalPages}
            aria-label="Last page"
            className="hidden sm:inline-flex h-9 w-9 bg-white border-border"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
