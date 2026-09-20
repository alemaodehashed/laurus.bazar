import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

export const QUARTERS = [
  { value: 1, label: '1º Trimestre (Jan - Mar)' },
  { value: 2, label: '2º Trimestre (Abr - Jun)' },
  { value: 3, label: '3º Trimestre (Jul - Set)' },
  { value: 4, label: '4º Trimestre (Out - Dez)' },
];

export const SEMESTERS = [
  { value: 1, label: '1º Semestre (Jan - Jun)' },
  { value: 2, label: '2º Semestre (Jul - Dez)' },
];

export const isDateInPeriod = (dateStr, period) => {
  if (!dateStr) return false;
  if (period.viewMode === 'todos') return true;

  const dayStr = String(dateStr).substring(0, 10);
  if (period.viewMode === 'data') {
    return dayStr === period.selectedDate;
  }

  const [y, m] = dayStr.split('-').map(Number);
  if (period.viewMode === 'ano') {
    return y === period.selectedYear;
  }

  if (period.viewMode === 'mes') {
    return y === period.selectedYear && (m - 1) === period.selectedMonth;
  }

  if (period.viewMode === 'trimestre') {
    if (y !== period.selectedYear) return false;
    if (period.selectedQuarter === 1) return m >= 1 && m <= 3;
    if (period.selectedQuarter === 2) return m >= 4 && m <= 6;
    if (period.selectedQuarter === 3) return m >= 7 && m <= 9;
    if (period.selectedQuarter === 4) return m >= 10 && m <= 12;
    return true;
  }

  if (period.viewMode === 'semestre') {
    if (y !== period.selectedYear) return false;
    if (period.selectedSemester === 1) return m >= 1 && m <= 6;
    if (period.selectedSemester === 2) return m >= 7 && m <= 12;
    return true;
  }

  return true;
};

export const getPeriodLabel = (period) => {
  if (period.viewMode === 'data') {
    return `Data: ${formatDate(period.selectedDate)}`;
  }
  if (period.viewMode === 'mes') {
    return `${MONTHS[period.selectedMonth]?.label} de ${period.selectedYear}`;
  }
  if (period.viewMode === 'trimestre') {
    return `${period.selectedQuarter}º Trimestre de ${period.selectedYear}`;
  }
  if (period.viewMode === 'semestre') {
    return `${period.selectedSemester}º Semestre de ${period.selectedYear}`;
  }
  if (period.viewMode === 'ano') {
    return `Ano ${period.selectedYear}`;
  }
  return 'Todo o Histórico';
};

export const PeriodFilterBar = ({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedQuarter,
  setSelectedQuarter,
  selectedSemester,
  setSelectedSemester,
  selectedYear,
  setSelectedYear,
  availableYears,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '20px',
        padding: '14px 20px',
        background: '#fff',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: '8px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'mes' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('mes')}
          >
            <Calendar size={13} /> Mês
          </button>

          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'data' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('data')}
          >
            📅 Por Data
          </button>

          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'trimestre' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('trimestre')}
          >
            📊 Trimestre
          </button>

          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'semestre' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('semestre')}
          >
            📈 Semestre
          </button>

          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'ano' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('ano')}
          >
            🗓️ Anual
          </button>

          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'todos' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '5px 10px' }}
            onClick={() => setViewMode('todos')}
          >
            ♾️ Geral
          </button>
        </div>

        {/* Dynamic Controls based on selected Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {viewMode === 'mes' && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handlePrevMonth}
                title="Mês anterior"
                style={{ padding: '6px 10px', fontWeight: 700 }}
              >
                ◀
              </button>

              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleNextMonth}
                title="Próximo mês"
                style={{ padding: '6px 10px', fontWeight: 700 }}
              >
                ▶
              </button>
            </>
          )}

          {viewMode === 'data' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                onClick={() => setSelectedDate(today)}
              >
                Hoje
              </button>
            </div>
          )}

          {viewMode === 'trimestre' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              >
                {QUARTERS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'semestre' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
              >
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'ano' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Ano:</span>
              <select
                className="form-control"
                style={{ width: 'auto', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'todos' && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-taupe)', fontWeight: 600 }}>
              Acumulado geral de todas as vendas
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
