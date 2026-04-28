import React from 'react';

const DateRangePicker = ({ checkIn, checkOut, onChange, nights }) => {
  return (
    <div className="mb-12 flex flex-wrap items-center justify-center gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Check-In</label>
        <input 
          type="date" 
          name="checkIn"
          value={checkIn}
          onChange={onChange}
          className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 focus:border-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Check-Out</label>
        <input 
          type="date" 
          name="checkOut"
          value={checkOut}
          onChange={onChange}
          className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 focus:border-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Noches</label>
        <div className="flex h-10 w-24 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-900/30">
          {nights}
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
