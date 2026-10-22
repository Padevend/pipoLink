import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Eye, EyeOff, GraduationCap, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '@/providers/toast/toastContext';
import { api, type AcademicFiliere, type AcademicLevel } from '@/share/lib/api';
import { Button } from '@/share/ui/Button';
import { Input } from '@/share/ui/Input';

const key = ['academic-paths'];

function orderAfter(items: { sortOrder: number }[]) {
  return Math.max(-1, ...items.map((item) => item.sortOrder)) + 1;
}

export function AcademicPathsFeat() {
  const client = useQueryClient();
  const { showToast } = useToast();
  const [filiereName, setFiliereName] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { data: catalog = [], isLoading } = useQuery({ queryKey: key, queryFn: api.getAcademicPaths });
  const refresh = () => client.invalidateQueries({ queryKey: key });

  const mutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => void refresh(),
    onError: (error: Error) => showToast({ type: 'error', message: error.message || 'Opération impossible.' }),
  });
  const run = (operation: () => Promise<unknown>, success: string) =>
    mutation.mutate(operation, { onSuccess: () => { void refresh(); showToast({ type: 'success', message: success }); } });
  const rename = (label: string, previous: string, save: (name: string) => Promise<unknown>) => {
    const name = window.prompt(`Modifier ${label}`, previous)?.trim();
    if (name && name !== previous) run(() => save(name), 'Nom mis à jour.');
  };
  const remove = (label: string, removeItem: () => Promise<unknown>) => {
    if (window.confirm(`Supprimer ${label} ? Les éléments enfants seront aussi supprimés.`)) run(removeItem, 'Élément supprimé.');
  };

  return (
    <div className="space-y-8 pb-10 text-zinc-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Parcours académiques</h1>
        <p className="mt-2 text-sm font-medium text-zinc-500">Le catalogue est immédiatement utilisé par l'application mobile pour le dépôt des documents.</p>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); const name = filiereName.trim(); if (!name) return; run(() => api.createAcademicFiliere({ name, sortOrder: orderAfter(catalog) }), 'Filière créée.'); setFiliereName(''); }} className="flex max-w-xl gap-3 rounded-[2rem] bg-zinc-50 p-4">
        <div className="flex-1"><Input value={filiereName} onChange={(event) => setFiliereName(event.target.value)} placeholder="Ajouter une filière" /></div>
        <Button type="submit" variant="primary" leftIcon={<Plus size={16} />}>Ajouter</Button>
      </form>

      {isLoading ? <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /></div> : (
        <div className="space-y-4">
          {catalog.map((filiere) => <FiliereNode key={filiere.id} filiere={filiere} expanded={open[filiere.id] ?? true} setExpanded={() => setOpen((value) => ({ ...value, [filiere.id]: !(value[filiere.id] ?? true) }))} run={run} rename={rename} remove={remove} />)}
          {!catalog.length && <div className="rounded-3xl bg-zinc-50 p-12 text-center text-sm text-zinc-500">Aucune filière dans le catalogue.</div>}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ active, onToggle, onRename, onDelete }: { active: boolean; onToggle: () => void; onRename: () => void; onDelete: () => void }) {
  return <div className="flex gap-1">
    <button type="button" onClick={onToggle} title={active ? 'Désactiver' : 'Activer'} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100">{active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    <button type="button" onClick={onRename} title="Renommer" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"><Pencil size={15} /></button>
    <button type="button" onClick={onDelete} title="Supprimer" className="rounded-full p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
  </div>;
}

function FiliereNode({ filiere, expanded, setExpanded, run, rename, remove }: { filiere: AcademicFiliere; expanded: boolean; setExpanded: () => void; run: (op: () => Promise<unknown>, success: string) => void; rename: (label: string, old: string, save: (name: string) => Promise<unknown>) => void; remove: (label: string, op: () => Promise<unknown>) => void }) {
  const [levelName, setLevelName] = useState('');
  return <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
    <div className="flex items-center gap-3 bg-zinc-50 p-5">
      <button type="button" onClick={setExpanded} className="rounded-full p-1 text-zinc-500">{expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</button>
      <GraduationCap size={19} className="text-orange-500" />
      <span className={`flex-1 font-bold ${filiere.isActive ? '' : 'text-zinc-400 line-through'}`}>{filiere.name}</span>
      <ActionButtons active={filiere.isActive} onToggle={() => run(() => api.updateAcademicFiliere(filiere.id, { isActive: !filiere.isActive }), 'Visibilité mise à jour.')} onRename={() => rename('la filière', filiere.name, (name) => api.updateAcademicFiliere(filiere.id, { name }))} onDelete={() => remove(`la filière « ${filiere.name} »`, () => api.deleteAcademicFiliere(filiere.id))} />
    </div>
    {expanded && <div className="space-y-4 p-5">
      <form onSubmit={(event) => { event.preventDefault(); const name = levelName.trim(); if (!name) return; run(() => api.createAcademicLevel({ filiereId: filiere.id, name, sortOrder: orderAfter(filiere.levels) }), 'Niveau créé.'); setLevelName(''); }} className="flex gap-2">
        <input value={levelName} onChange={(event) => setLevelName(event.target.value)} placeholder="Ajouter un niveau" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" />
        <Button type="submit" variant="secondary" leftIcon={<Plus size={15} />}>Niveau</Button>
      </form>
      {filiere.levels.map((level) => <LevelNode key={level.id} level={level} run={run} rename={rename} remove={remove} />)}
    </div>}
  </section>;
}

function LevelNode({ level, run, rename, remove }: { level: AcademicLevel; run: (op: () => Promise<unknown>, success: string) => void; rename: (label: string, old: string, save: (name: string) => Promise<unknown>) => void; remove: (label: string, op: () => Promise<unknown>) => void }) {
  const [unitName, setUnitName] = useState('');
  return <div className="rounded-2xl border border-zinc-100 p-4">
    <div className="flex items-center gap-3"><span className={`flex-1 text-sm font-bold ${level.isActive ? '' : 'text-zinc-400 line-through'}`}>{level.name}</span><ActionButtons active={level.isActive} onToggle={() => run(() => api.updateAcademicLevel(level.id, { isActive: !level.isActive }), 'Visibilité mise à jour.')} onRename={() => rename('le niveau', level.name, (name) => api.updateAcademicLevel(level.id, { name }))} onDelete={() => remove(`le niveau « ${level.name} »`, () => api.deleteAcademicLevel(level.id))} /></div>
    <div className="mt-3 flex flex-wrap gap-2">{level.units.map((unit) => <span key={unit.id} className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pl-3 pr-1 text-xs font-medium ${unit.isActive ? '' : 'opacity-45 line-through'}`}><span>{unit.name}</span><button type="button" title={unit.isActive ? 'Désactiver' : 'Activer'} onClick={() => run(() => api.updateAcademicUnit(unit.id, { isActive: !unit.isActive }), 'Visibilité mise à jour.')} className="rounded-full p-1">{unit.isActive ? <Eye size={11} /> : <EyeOff size={11} />}</button><button type="button" onClick={() => rename("l'UE", unit.name, (name) => api.updateAcademicUnit(unit.id, { name }))} className="rounded-full p-1"><Pencil size={11} /></button><button type="button" onClick={() => remove(`l'UE « ${unit.name} »`, () => api.deleteAcademicUnit(unit.id))} className="rounded-full p-1 text-red-500"><Trash2 size={11} /></button></span>)}</div>
    <form onSubmit={(event) => { event.preventDefault(); const name = unitName.trim(); if (!name) return; run(() => api.createAcademicUnit({ levelId: level.id, name, sortOrder: orderAfter(level.units) }), 'UE créée.'); setUnitName(''); }} className="mt-3 flex gap-2"><input value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Ajouter une UE" className="h-9 flex-1 rounded-xl border border-zinc-200 px-3 text-xs" /><button className="rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white">Ajouter</button></form>
  </div>;
}
