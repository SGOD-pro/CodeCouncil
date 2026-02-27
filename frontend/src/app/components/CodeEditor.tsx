"use client";

import React from "react";

interface CodeEditorProps {
    code: string;
}

const TOKEN_COLORS: Record<string, string> = {
    keyword: "text-purple-400",
    string: "text-green-400",
    comment: "text-zinc-500",
    function: "text-blue-300",
    default: "text-zinc-300",
    number: "text-orange-400",
    operator: "text-zinc-400",
};

function tokenizeLine(line: string): React.ReactNode {
    // Simple JSX/TS tokenizer for visual effect
    const patterns: { regex: RegExp; type: string }[] = [
        { regex: /^(import|export|default|function|return|from|const|let|var|if|else|for|while|class|extends|new)(?=\s|$|\()/, type: "keyword" },
        { regex: /^(['"`])(.*?)\1/, type: "string" },
        { regex: /^(\/\/.*)/, type: "comment" },
        { regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)/, type: "default" },
        { regex: /^(\d+)/, type: "number" },
        { regex: /^([{}()[\]<>;:,.=+\-*/%!|&^~?])/, type: "operator" },
        { regex: /^(\s+)/, type: "space" },
    ];

    const nodes: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
        let matched = false;
        for (const { regex, type } of patterns) {
            const m = remaining.match(regex);
            if (m) {
                const text = m[0];
                if (type === "space") {
                    nodes.push(<span key={key++}>{text}</span>);
                } else if (type === "keyword") {
                    nodes.push(<span key={key++} className="text-purple-400 font-medium">{text}</span>);
                } else if (type === "string") {
                    nodes.push(<span key={key++} className="text-green-400">{text}</span>);
                } else if (type === "comment") {
                    nodes.push(<span key={key++} className="text-zinc-500 italic">{text}</span>);
                } else if (type === "number") {
                    nodes.push(<span key={key++} className="text-orange-400">{text}</span>);
                } else if (type === "operator") {
                    nodes.push(<span key={key++} className="text-zinc-400">{text}</span>);
                } else {
                    nodes.push(<span key={key++} className="text-zinc-200">{text}</span>);
                }
                remaining = remaining.slice(text.length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            nodes.push(<span key={key++} className="text-zinc-300">{remaining[0]}</span>);
            remaining = remaining.slice(1);
        }
    }
    return <>{nodes}</>;
}

export default function CodeEditor({ code }: CodeEditorProps) {
    const lines = code.split("\n");

    return (
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#0e1117] font-mono text-sm">
            <table className="w-full border-collapse">
                <tbody>
                    {lines.map((line, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] group">
                            <td className="select-none text-right pr-5 pl-4 py-0.5 text-zinc-600 text-xs w-10 border-r border-white/5 group-hover:text-zinc-500">
                                {i + 1}
                            </td>
                            <td className="pl-5 pr-4 py-0.5 whitespace-pre">
                                {tokenizeLine(line)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
