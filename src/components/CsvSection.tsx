import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { db } from "@/db";
import { downloadCSV, roastLogsToCSV } from "@/lib/csvExport";
import { mergeImport, parseRoastLogCSV } from "@/lib/csvImport";
import { RoastLogRepository } from "@/repositories/roastLogRepository";

const repo = new RoastLogRepository(db.roastLogs);

export function CsvSection() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [duplicateMode, setDuplicateMode] = useState<"overwrite" | "skip">(
    "skip",
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExport() {
    const logs = await repo.findAll();
    const csv = roastLogsToCSV(logs);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `roastlogs-${date}.csv`);
  }

  async function handleImport() {
    setError(null);
    setSuccess(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }
    const text = await file.text();
    const result = parseRoastLogCSV(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const existing = await repo.findAll();
    const merged = mergeImport(result.rows, existing, duplicateMode);
    await Promise.all(merged.map((log) => repo.save(log)));
    await queryClient.invalidateQueries({ queryKey: ["roastLogs"] });
    setSuccess(`${result.rows.length} 件をインポートしました`);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="w-fit rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          CSV エクスポート
        </button>
        <p className="text-sm text-gray-500">
          全 RoastLog を CSV ファイルとしてダウンロードします
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded border p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="csv-file" className="text-sm font-medium">
            CSV ファイル
          </label>
          <input
            id="csv-file"
            ref={fileRef}
            type="file"
            accept=".csv"
            className="text-sm"
          />
        </div>

        <fieldset className="flex gap-4">
          <legend className="mb-1 text-sm font-medium">重複 ID の処理</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="duplicate-mode"
              value="skip"
              checked={duplicateMode === "skip"}
              onChange={() => setDuplicateMode("skip")}
            />
            スキップ
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="duplicate-mode"
              value="overwrite"
              checked={duplicateMode === "overwrite"}
              onChange={() => setDuplicateMode("overwrite")}
            />
            上書き
          </label>
        </fieldset>

        <button
          type="button"
          onClick={handleImport}
          className="w-fit rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          インポート
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </div>
    </div>
  );
}
