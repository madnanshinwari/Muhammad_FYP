import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Badge } from '../common/Badge.jsx';
import { Thermometer, CheckCircle2 } from 'lucide-react';

export function MilkingBatchTable({ batches = [] }) {
  const { t, lang } = useLanguage();

  return (
    <div className="card-elevation-1 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header Row: #F3F7F1 with 11px tracking labels in #14532D */}
          <thead>
            <tr className="bg-[#F3F7F1] border-b border-[#E2E8F0] text-[#14532D] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">{t('batchCode')}</th>
              <th className="py-3.5 px-4">{t('livestock')}</th>
              <th className="py-3.5 px-4">{t('session')}</th>
              <th className="py-3.5 px-4 text-right">{t('yieldLiters')}</th>
              <th className="py-3.5 px-4 text-center">{t('fatLabel')} %</th>
              <th className="py-3.5 px-4 text-center">{t('snfLabel')} %</th>
              <th className="py-3.5 px-4 text-center">{t('chillerTemp')}</th>
              <th className="py-3.5 px-4">{t('vetOfficer')}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {batches.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  {lang === 'ur' ? 'کوئی بیچ لاگ ریکارڈ موجود نہیں' : 'No milking batch records found.'}
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr
                  key={batch.id || batch.batch_code}
                  className="hover:bg-[#FFFDF5] transition-colors group"
                >
                  {/* Batch Code */}
                  <td className="py-3 px-4 font-semibold text-[#14532D] tabular-nums">
                    <span className="font-mono text-xs">{batch.batch_code}</span>
                  </td>

                  {/* Livestock Tag */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#111d23]">
                      {batch.livestock_tag}
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {batch.animal_type}
                    </span>
                  </td>

                  {/* Session */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      batch.session === 'Morning' 
                        ? 'bg-[#FEF3C7] text-[#92400E]' 
                        : 'bg-[#E0E7FF] text-[#3730A3]'
                    }`}>
                      {batch.session === 'Morning' ? '🌅 Morning' : '🌙 Evening'}
                    </span>
                  </td>

                  {/* Yield (Liters) - Tabular Nums */}
                  <td className="py-3 px-4 text-right font-bold text-[#111d23] tabular-nums">
                    {Number(batch.yield_liters).toFixed(1)} L
                  </td>

                  {/* Fat % */}
                  <td className="py-3 px-4 text-center font-semibold text-[#14532D] tabular-nums">
                    <Badge variant="metric">{batch.fat_percentage}%</Badge>
                  </td>

                  {/* SNF % */}
                  <td className="py-3 px-4 text-center font-semibold text-[#14532D] tabular-nums">
                    <Badge variant="metric">{batch.snf_percentage}%</Badge>
                  </td>

                  {/* Chiller Temp */}
                  <td className="py-3 px-4 text-center tabular-nums">
                    <span className="inline-flex items-center gap-1 font-bold text-[#006d25] bg-[#F3F7F1] px-2 py-0.5 rounded">
                      <Thermometer className="w-3 h-3 text-[#218838]" />
                      {batch.chiller_temp_c}°C
                    </span>
                  </td>

                  {/* Recorded By */}
                  <td className="py-3 px-4 text-gray-600 text-[11px]">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                      <span>{batch.recorded_by}</span>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
