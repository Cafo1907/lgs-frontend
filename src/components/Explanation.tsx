// AI çözüm açıklamaları basit markdown (##, ###, **kalın**, -, ---, >) ile üretiliyor.
// Harici bir markdown kütüphanesi eklemeden hafif bir render yapıyoruz.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export default function Explanation({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc list-inside space-y-1 my-2">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    const key = `b-${idx}`;

    if (line === '') { flushList(`${key}-flush`); return; }
    if (line === '---') { flushList(`${key}-flush`); blocks.push(<hr key={key} className="my-3 border-current opacity-20" />); return; }
    if (line.startsWith('### ')) { flushList(`${key}-flush`); blocks.push(<h4 key={key} className="text-sm font-bold mt-3 mb-1">{renderInline(line.slice(4), key)}</h4>); return; }
    if (line.startsWith('## ')) { flushList(`${key}-flush`); blocks.push(<h3 key={key} className="text-base font-bold mt-3 mb-1">{renderInline(line.slice(3), key)}</h3>); return; }
    if (line.startsWith('> ')) { flushList(`${key}-flush`); blocks.push(<blockquote key={key} className="border-l-4 border-current/30 pl-3 italic my-2">{renderInline(line.slice(2), key)}</blockquote>); return; }
    if (line.startsWith('- ')) { listBuffer.push(line.slice(2)); return; }

    flushList(`${key}-flush`);
    blocks.push(<p key={key} className="my-1.5 leading-relaxed">{renderInline(line, key)}</p>);
  });
  flushList('final-flush');

  return <>{blocks}</>;
}
