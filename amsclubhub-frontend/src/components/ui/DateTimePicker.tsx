'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
	value: string; // "YYYY-MM-DDTHH:mm" hoặc ""
	onChange: (v: string) => void;
	placeholder?: string;
	disabled?: boolean;
}

type Field = 'day' | 'month' | 'year' | 'hour' | 'minute';

const pad = (n: number) => String(n).padStart(2, '0');

function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate(); // month 1-12
}

function formatDisplay(value: string): string {
	const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
	if (!m) return value;
	return `${m[2]}/${m[3]}/${m[1]}, ${m[4]}:${m[5]}`;
}

// Ô dropdown chọn 1 giá trị, có nhãn phía trước và độ rộng cố định
function ValueSelect({
	label,
	selected,
	options,
	open,
	onToggle,
	onSelect,
}: {
	label: string;
	selected: number;
	options: number[];
	open: boolean;
	onToggle: () => void;
	onSelect: (v: number) => void;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
			<div className="relative w-32">
				<button
					type="button"
					onClick={onToggle}
					className={cn(
						'flex w-full items-center justify-between gap-1 bg-muted/50 border border-border px-2 py-1.5 text-sm transition-all cursor-pointer focus:outline-none',
						open
							? 'rounded-t-lg border-primary border-b-border bg-muted'
							: 'rounded-lg hover:border-border/80 focus:border-primary'
					)}
				>
					<span className="truncate">{pad(selected)}</span>
					<ChevronDown
						className={cn(
							'w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
							open && 'rotate-180'
						)}
					/>
				</button>
				{open && (
					<div className="absolute top-full left-0 right-0 -mt-px z-30 bg-muted border border-t-0 border-border rounded-b-lg shadow-xl overflow-hidden">
						<div className="max-h-40 overflow-y-auto">
							{options.map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => {
										onSelect(v);
										onToggle();
									}}
									className={cn(
										'w-full text-center px-2 py-1.5 text-sm transition-colors cursor-pointer',
										v === selected
											? 'bg-accent font-medium text-accent-foreground'
											: 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
									)}
								>
									{pad(v)}
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function DateTimePicker({
	value,
	onChange,
	placeholder = 'Chọn ngày giờ',
	disabled,
}: DateTimePickerProps) {
	const [open, setOpen] = useState(false);
	const [activeField, setActiveField] = useState<Field | null>(null);
	const now = useMemo(() => new Date(), []);
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [day, setDay] = useState(now.getDate());
	const [hour, setHour] = useState(12);
	const [minute, setMinute] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	// Đồng bộ giá trị từ `value` khi mở
	useEffect(() => {
		if (open && value) {
			const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
			if (m) {
				setYear(parseInt(m[1], 10));
				setMonth(parseInt(m[2], 10));
				setDay(parseInt(m[3], 10));
				setHour(parseInt(m[4], 10));
				setMinute(parseInt(m[5], 10));
			}
		}
	}, [open, value]);

	// Đóng khi click ra ngoài
	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
				setActiveField(null);
			}
		}
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	}, [open]);

	const maxDay = daysInMonth(year, month);
	const currentYear = now.getFullYear();
	const years = useMemo(() => {
		const base = [currentYear, currentYear + 1];
		if (year && !base.includes(year)) {
			return [...base, year].sort((a, b) => a - b);
		}
		return base;
	}, [currentYear, year]);

	const emit = (y: number, mo: number, d: number, h: number, mi: number) => {
		onChange(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`);
	};

	const setDate = (next: { y?: number; mo?: number; d?: number }) => {
		const y = next.y ?? year;
		const mo = next.mo ?? month;
		const max = daysInMonth(y, mo);
		const d = Math.min(next.d ?? day, max);
		setYear(y);
		setMonth(mo);
		setDay(d);
		emit(y, mo, d, hour, minute);
	};

	const setTime = (next: { h?: number; mi?: number }) => {
		const h = next.h ?? hour;
		const mi = next.mi ?? minute;
		setHour(h);
		setMinute(mi);
		emit(year, month, day, h, mi);
	};

	const toggle = (f: Field) => {
		setActiveField((prev) => (prev === f ? null : f));
	};

	return (
		<div ref={containerRef} className="relative">
			{/* Ô hiển thị chính — đồng bộ màu với các ô Input khác */}
			<button
				type="button"
				disabled={disabled}
				onClick={() => {
					setOpen((o) => !o);
					setActiveField(null);
				}}
				className={cn(
					'flex w-full h-8 items-center justify-between gap-2 bg-transparent border px-2.5 py-1 text-sm transition-all cursor-pointer focus:outline-none',
					open
						? 'rounded-t-lg border-primary border-b-border bg-muted'
						: 'rounded-lg border-input hover:border-border/80 focus:border-primary focus-visible:ring-3 focus-visible:ring-ring/50',
					value ? 'text-foreground' : 'text-muted-foreground/60',
					disabled && 'pointer-events-none opacity-50'
				)}
			>
				<span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
				<ChevronDown
					className={cn(
						'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200',
						open && 'rotate-180'
					)}
				/>
			</button>

			{/* Bảng chọn — nối liền với ô input, chọn từng giá trị một */}
			{open && (
				<div className="absolute top-full left-0 right-0 -mt-px z-20 bg-muted border border-t-0 border-border shadow-xl rounded-b-lg">
					<div className="p-2 space-y-2">
						{/* Hàng 1: Ngày - Tháng - Năm */}
						<div className="flex items-center gap-3">
							<ValueSelect
								label="Ngày"
								selected={day}
								options={Array.from({ length: maxDay }, (_, i) => i + 1)}
								open={activeField === 'day'}
								onToggle={() => toggle('day')}
								onSelect={(v) => setDate({ d: v })}
							/>
							<ValueSelect
								label="Tháng"
								selected={month}
								options={Array.from({ length: 12 }, (_, i) => i + 1)}
								open={activeField === 'month'}
								onToggle={() => toggle('month')}
								onSelect={(v) => setDate({ mo: v })}
							/>
							<ValueSelect
								label="Năm"
								selected={year}
								options={years}
								open={activeField === 'year'}
								onToggle={() => toggle('year')}
								onSelect={(v) => setDate({ y: v })}
							/>
						</div>
						{/* Hàng 2: Giờ - Phút */}
						<div className="flex items-center gap-3">
							<ValueSelect
								label="Giờ"
								selected={hour}
								options={Array.from({ length: 24 }, (_, i) => i)}
								open={activeField === 'hour'}
								onToggle={() => toggle('hour')}
								onSelect={(v) => setTime({ h: v })}
							/>
							<ValueSelect
								label="Phút"
								selected={minute}
								options={Array.from({ length: 60 }, (_, i) => i)}
								open={activeField === 'minute'}
								onToggle={() => toggle('minute')}
								onSelect={(v) => setTime({ mi: v })}
							/>
						</div>
					</div>

					<div className="flex items-center justify-between gap-2 border-t border-border rounded-b-lg bg-muted/50 px-2 py-1.5">
						{value ? (
							<button
								type="button"
								onClick={() => {
									onChange('');
									setOpen(false);
									setActiveField(null);
								}}
								className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
							>
								<X className="h-3.5 w-3.5" /> Xóa
							</button>
						) : (
							<span />
						)}
						<button
							type="button"
							onClick={() => {
								setOpen(false);
								setActiveField(null);
							}}
							className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 cursor-pointer"
						>
							<Check className="h-3.5 w-3.5" /> Xong
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
