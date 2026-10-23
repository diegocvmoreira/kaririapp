import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, AlertCircle, MapPin, Database, ArrowRight, RefreshCw } from 'lucide-react';
import { placesApi } from '../../services/api/places';

interface PlaceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VALID_CATEGORIES = [
  'gastronomia',
  'turismo',
  'cultura-arte',
  'vida-noturna',
  'natureza-e-trilhas',
  'compras-e-artesanato',
  'religiosidade',
  'servicos',
  'eventos',
];

export const PlaceImportModal: React.FC<PlaceImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    research_metadata?: Record<string, unknown>;
    places: Array<Record<string, unknown>>;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Analysis / Preview Stats
  const [stats, setStats] = useState<{
    total: number;
    withCoords: number;
    withoutCoords: number;
    invalidCategories: Array<{ index: number; name: string; cat: string }>;
    duplicates: string[];
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; placeName: string } | null>(null);
  const [importReport, setImportReport] = useState<{
    total: number;
    created: number;
    updated: number;
    ignored: number;
    with_coordinates: number;
    without_coordinates: number;
    errors: Array<{ index: number; name?: string; slug?: string; error: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const analyzePlacesJson = (rawContent: string, name: string = 'arquivo.json') => {
    setParseError(null);
    setImportReport(null);
    setProgressInfo(null);

    try {
      const data = JSON.parse(rawContent);
      let placesArray: Array<Record<string, unknown>> = [];

      if (Array.isArray(data)) {
        placesArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.places)) {
        placesArray = data.places;
      } else {
        throw new Error('O JSON deve ser um array de locais ou conter a propriedade "places" contendo um array.');
      }

      if (placesArray.length === 0) {
        throw new Error('Nenhum local encontrado no JSON.');
      }

      const seenSlugs = new Set<string>();
      const duplicateList: string[] = [];
      const invalidCats: Array<{ index: number; name: string; cat: string }> = [];
      let withCoords = 0;
      let withoutCoords = 0;

      placesArray.forEach((item, idx) => {
        const slug = String(item.slug || '').trim();
        const itemName = String(item.name || `Item ${idx + 1}`);
        const catSlug = String(item.category_slug || '').trim();

        if (slug) {
          if (seenSlugs.has(slug)) {
            duplicateList.push(slug);
          } else {
            seenSlugs.add(slug);
          }
        }

        if (!VALID_CATEGORIES.includes(catSlug)) {
          invalidCats.push({ index: idx + 1, name: itemName, cat: catSlug || '(vazio)' });
        }

        const lat = item.latitude;
        const lng = item.longitude;
        const hasCoords =
          lat !== null &&
          lng !== null &&
          lat !== undefined &&
          lng !== undefined &&
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          Number.isFinite(lat) &&
          Number.isFinite(lng);

        if (hasCoords) {
          withCoords++;
        } else {
          withoutCoords++;
        }
      });

      setFileName(name);
      setParsedData({
        research_metadata: data.research_metadata || { project: 'Kariri.app' },
        places: placesArray,
      });
      setStats({
        total: placesArray.length,
        withCoords,
        withoutCoords,
        invalidCategories: invalidCats,
        duplicates: duplicateList,
      });
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'JSON inválido');
      setParsedData(null);
      setStats(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      analyzePlacesJson(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadApprovedMvp = async () => {
    try {
      const res = await fetch('/kariri_places_mvp_aprovados.json');
      if (!res.ok) throw new Error('Não foi possível carregar kariri_places_mvp_aprovados.json');
      const text = await res.text();
      setJsonText(text);
      analyzePlacesJson(text, 'kariri_places_mvp_aprovados.json');
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Erro ao carregar arquivo de locais aprovados');
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsSubmitting(true);
    setParseError(null);
    try {
      const report = await placesApi.importPlaces(parsedData, (info) => {
        setProgressInfo(info);
      });
      setImportReport(report);
      onSuccess();
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Falha na requisição de importação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJsonText('');
    setFileName(null);
    setParsedData(null);
    setStats(null);
    setImportReport(null);
    setParseError(null);
    setProgressInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Importar Locais JSON (POST /admin/places/import)
              </h2>
              <p className="text-xs text-gray-500">
                Auditoria de dados do MVP, coordenadas válidas e status pendente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Sucesso final após importação */}
          {importReport ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Importação Concluída com Sucesso!</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Os registros foram criados ou atualizados utilizando o <strong>slug</strong> como chave exclusiva. Registros autorizados publicados com <strong className="underline">status=published</strong> e <strong className="underline">verified=true</strong>.
                  </p>
                </div>
              </div>

              {/* Estatísticas do relatório */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-xl font-black text-gray-900">{importReport.total}</span>
                  <p className="text-[11px] text-gray-500 font-medium">Total Processado</p>
                </div>
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-xl font-black text-emerald-700">{importReport.created}</span>
                  <p className="text-[11px] text-emerald-700 font-medium">Novos Criados</p>
                </div>
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 text-center">
                  <span className="text-xl font-black text-blue-700">{importReport.updated}</span>
                  <p className="text-[11px] text-blue-700 font-medium">Atualizados</p>
                </div>
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 text-center">
                  <span className="text-xl font-black text-amber-700">{importReport.ignored}</span>
                  <p className="text-[11px] text-amber-700 font-medium">Ignorados</p>
                </div>
              </div>

              {/* Coordenadas auditadas */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Auditoria Geográfica:</p>
                <p>• {importReport.with_coordinates} local(is) possuem coordenadas exatas e aparecerão no mapa OpenStreetMap.</p>
                <p>• {importReport.without_coordinates} local(is) estão sem coordenadas e exibirão o aviso &ldquo;Localização ainda não confirmada&rdquo; (nenhuma coordenada falsa foi inserida).</p>
              </div>

              {importReport.errors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                  <p className="font-bold text-red-900">Avisos e inconsistências:</p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                    {importReport.errors.map((err, i) => (
                      <li key={i}>{err.slug || err.name || `Item ${err.index}`}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Etapa 1: Seleção do Arquivo ou MVP padrão */}
              {!stats && (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-gray-200 hover:border-[#DE1F2A] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-gray-50/50 hover:bg-[#FDE8E9]/20 group">
                    <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-[#DE1F2A] transition" />
                    <span className="mt-2 text-sm font-bold text-gray-800">
                      Clique para selecionar o arquivo .json
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Aceita arquivo com a chave &quot;places&quot; ou array puro de locais
                    </span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Opção Recomendada: Arquivo Aprovado para o MVP */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Arquivo Aprovado para Publicação (33 locais)
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          kariri_places_mvp_aprovados.json • status=published, verified=true
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadApprovedMvp}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
                    >
                      Carregar Aprovados
                    </button>
                  </div>
                </div>
              )}

              {/* Erro de parsing */}
              {parseError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Etapa 2: Prévia e Estatísticas Obrigatórias (PARTE 5) */}
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#DE1F2A]" />
                      <span className="text-xs font-bold text-gray-900">{fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-gray-500 hover:text-gray-900 underline"
                    >
                      Trocar arquivo
                    </button>
                  </div>

                  {/* Badges de auditoria */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                      <span className="text-lg font-black text-gray-900">{stats.total}</span>
                      <p className="text-[11px] text-gray-500">Locais para importar</p>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-center">
                      <span className="text-lg font-black text-emerald-700">{stats.withCoords}</span>
                      <p className="text-[11px] text-emerald-700 font-medium">Com coordenadas</p>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 text-center">
                      <span className="text-lg font-black text-amber-700">{stats.withoutCoords}</span>
                      <p className="text-[11px] text-amber-700 font-medium">Sem coordenadas</p>
                    </div>

                    <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100 text-center">
                      <span className="text-lg font-black text-rose-700">{stats.invalidCategories.length}</span>
                      <p className="text-[11px] text-rose-700 font-medium">Categorias inválidas</p>
                    </div>
                  </div>
                  {/* Indicador de progresso em tempo real durante importação */}
                  {isSubmitting && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" />
                          <span className="truncate max-w-[340px]">
                            {progressInfo
                              ? `Salvando ${progressInfo.current} de ${progressInfo.total}: ${progressInfo.placeName}`
                              : 'Enviando requisição ao backend real...'}
                          </span>
                        </span>
                        <span>
                          {progressInfo && progressInfo.total > 0
                            ? `${Math.round((progressInfo.current / progressInfo.total) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#DE1F2A] h-2 rounded-full transition-all duration-300"
                          style={{
                            width: progressInfo && progressInfo.total > 0
                              ? `${Math.min(100, Math.round((progressInfo.current / progressInfo.total) * 100))}%`
                              : '15%',
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Inserindo registros no banco de dados via POST /admin/places. Os locais já cadastrados são ignorados com segurança.
                      </p>
                    </div>
                  )}

                  {/* Alertas específicos de validação */}
                  {stats.duplicates.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Slugs duplicados detectados:</strong> {stats.duplicates.join(', ')}
                      </div>
                    </div>
                  )}

                  {stats.invalidCategories.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Categorias fora do schema:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          {stats.invalidCategories.map((c, i) => (
                            <li key={i}>{c.name} ({c.cat})</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Regras obrigatórias de segurança e publicação */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#DE1F2A]" />
                      <span>Diretrizes de Publicação e Integridade:</span>
                    </p>
                    <p>• {parsedData?.places.some(p => p.status === 'published') ? (
                      <>Locais aprovados serão publicados diretamente (<strong className="text-slate-900">status=published</strong>, <strong className="text-slate-900">verified=true</strong>, <strong className="text-slate-900">needs_review=false</strong>).</>
                    ) : (
                      <>Locais em auditoria permanecerão como <strong className="text-slate-900">status=pending</strong> e <strong className="text-slate-900">verified=false</strong>.</>
                    )}</p>
                    <p>• Os {stats.withoutCoords} locais sem coordenadas permanecerão estritamente com latitude=null e longitude=null (sem marcadores no mapa).</p>
                    <p>• Os {stats.withCoords} locais com coordenadas confirmadas recebem marcadores no Leaflet OpenStreetMap com cores por categoria.</p>
                    <p>• Imagens mantidas como lista vazia com placeholders locais por categoria.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          {importReport ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold transition"
              >
                Cancelar
              </button>
              {stats && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isSubmitting || stats.invalidCategories.length > 0}
                  className="px-5 py-2.5 bg-[#DE1F2A] hover:bg-[#C51620] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importando no Laravel...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar e Importar ({stats.total} locais)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
