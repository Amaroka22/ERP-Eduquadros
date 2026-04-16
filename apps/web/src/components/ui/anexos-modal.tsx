"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, Download, Trash2, FileText, FileImage, File, X, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { salvarAnexo, baixarAnexo, removerAnexo } from "@/lib/anexos";
import type { Anexo } from "@/contexts/AppContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ tipo }: { tipo: string }) {
  if (tipo.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-500" />;
  if (tipo === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function extBadge(nome: string, tipo: string): string {
  const ext = nome.split(".").pop()?.toUpperCase();
  if (ext) return ext;
  if (tipo.startsWith("image/")) return tipo.split("/")[1].toUpperCase();
  return "FILE";
}

interface AnexosModalProps {
  open: boolean;
  onClose: () => void;
  lancamentoId: number;
  descricao: string;
  anexos: Anexo[];
  onUpdate: (anexos: Anexo[]) => void;
}

export function AnexosModal({ open, onClose, lancamentoId, descricao, anexos, onUpdate }: AnexosModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  async function processarArquivos(files: FileList | File[]) {
    const arr = Array.from(files);
    const novosErros: string[] = [];
    const novosAnexos: Anexo[] = [];

    setUploading(true);
    for (const file of arr) {
      if (file.size > MAX_FILE_SIZE) {
        novosErros.push(`"${file.name}" excede o limite de 10 MB.`);
        continue;
      }
      const id = `${lancamentoId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        await salvarAnexo(id, file);
        novosAnexos.push({
          id,
          nome: file.name,
          tipo: file.type || "application/octet-stream",
          tamanho: file.size,
          criado: new Date().toISOString(),
        });
      } catch {
        novosErros.push(`Erro ao salvar "${file.name}".`);
      }
    }
    setUploading(false);
    setErros(novosErros);
    if (novosAnexos.length > 0) onUpdate([...anexos, ...novosAnexos]);
  }

  async function handleDownload(anexo: Anexo) {
    setBaixando(anexo.id);
    try {
      await baixarAnexo(anexo.id, anexo.nome, anexo.tipo);
    } catch {
      setErros([`Não foi possível baixar "${anexo.nome}". O arquivo pode ter sido perdido.`]);
    } finally {
      setBaixando(null);
    }
  }

  async function handleRemover(anexo: Anexo) {
    setRemovendo(anexo.id);
    try {
      await removerAnexo(anexo.id);
      onUpdate(anexos.filter(a => a.id !== anexo.id));
    } finally {
      setRemovendo(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files);
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Anexos
            {anexos.length > 0 && (
              <Badge variant="secondary" className="text-xs">{anexos.length}</Badge>
            )}
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{descricao}</p>
        </DialogHeader>

        {/* Upload zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload className={cn("h-6 w-6 mx-auto mb-2", dragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium">{uploading ? "Salvando..." : "Clique ou arraste arquivos aqui"}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, imagens, planilhas — até 10 MB por arquivo</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => e.target.files && processarArquivos(e.target.files)}
          />
        </div>

        {/* Erros */}
        {erros.length > 0 && (
          <div className="space-y-1">
            {erros.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {e}
                <button className="ml-auto" onClick={() => setErros(prev => prev.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lista de arquivos */}
        {anexos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">Nenhum arquivo anexado ainda.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {anexos.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <FileIcon tipo={a.tipo} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">{extBadge(a.nome, a.tipo)}</Badge>
                    <span className="text-xs text-muted-foreground">{formatBytes(a.tamanho)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.criado).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Baixar"
                    disabled={baixando === a.id}
                    onClick={() => handleDownload(a)}
                  >
                    <Download className={cn("h-3.5 w-3.5", baixando === a.id && "animate-pulse")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="Remover"
                    disabled={removendo === a.id}
                    onClick={() => handleRemover(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
