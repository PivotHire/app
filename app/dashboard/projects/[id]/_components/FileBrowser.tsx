'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
    Folder, File, ChevronRight, ChevronDown,
    FileCode, FileText, FileJson, Image as ImageIcon,
    Loader2, FolderGit2, AlertCircle
} from 'lucide-react';

interface FileBrowserProps {
    giteaOwner: string | null;
    giteaRepo: string | null;
}

interface TreeEntry {
    path: string;
    type: 'blob' | 'tree';
    size?: number;
}

interface TreeNode {
    name: string;
    path: string;
    type: 'blob' | 'tree';
    size?: number;
    children: TreeNode[];
}

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
        case 'py':
        case 'go':
        case 'rs':
        case 'java':
        case 'rb':
        case 'php':
        case 'css':
        case 'scss':
        case 'html':
        case 'vue':
        case 'svelte':
            return <FileCode size={14} className="text-blue-500 shrink-0" />;
        case 'json':
        case 'yaml':
        case 'yml':
        case 'toml':
            return <FileJson size={14} className="text-amber-500 shrink-0" />;
        case 'md':
        case 'txt':
        case 'csv':
            return <FileText size={14} className="text-gray-500 shrink-0" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
        case 'ico':
            return <ImageIcon size={14} className="text-purple-500 shrink-0" />;
        default:
            return <File size={14} className="text-gray-400 shrink-0" />;
    }
}

function getLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
        py: 'python', go: 'go', rs: 'rust', java: 'java', rb: 'ruby', php: 'php',
        css: 'css', scss: 'scss', html: 'html', vue: 'vue', svelte: 'svelte',
        json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
        md: 'markdown', txt: 'text', sh: 'bash', sql: 'sql',
        prisma: 'prisma', dockerfile: 'dockerfile',
    };
    return langMap[ext || ''] || 'text';
}

function buildTree(entries: TreeEntry[]): TreeNode[] {
    const root: TreeNode[] = [];

    // Sort: directories first, then alphabetical
    const sorted = [...entries].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
        return a.path.localeCompare(b.path);
    });

    for (const entry of sorted) {
        const parts = entry.path.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const name = parts[i];
            const partial = parts.slice(0, i + 1).join('/');
            const isLast = i === parts.length - 1;

            let existing = current.find(n => n.name === name);

            if (!existing) {
                existing = {
                    name,
                    path: partial,
                    type: isLast ? entry.type : 'tree',
                    size: isLast ? entry.size : undefined,
                    children: [],
                };
                current.push(existing);
            }

            current = existing.children;
        }
    }

    return root;
}

function TreeItem({
    node,
    depth,
    selectedPath,
    onFileSelect,
}: {
    node: TreeNode;
    depth: number;
    selectedPath: string | null;
    onFileSelect: (path: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const isDir = node.type === 'tree';
    const isSelected = selectedPath === node.path;

    // Sort children: directories first
    const sortedChildren = [...node.children].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div>
            <button
                onClick={() => {
                    if (isDir) {
                        setIsOpen(!isOpen);
                    } else {
                        onFileSelect(node.path);
                    }
                }}
                className={cn(
                    'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-gray-100',
                    isSelected && 'bg-blue-50 text-blue-700 hover:bg-blue-50',
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {isDir ? (
                    <>
                        {isOpen ? (
                            <ChevronDown size={12} className="text-gray-400 shrink-0" />
                        ) : (
                            <ChevronRight size={12} className="text-gray-400 shrink-0" />
                        )}
                        <Folder size={14} className={cn(
                            'shrink-0',
                            isOpen ? 'text-blue-500' : 'text-amber-500'
                        )} />
                    </>
                ) : (
                    <>
                        <span className="w-3" />
                        {getFileIcon(node.name)}
                    </>
                )}
                <span className="truncate">{node.name}</span>
            </button>

            {isDir && isOpen && sortedChildren.map(child => (
                <TreeItem
                    key={child.path}
                    node={child}
                    depth={depth + 1}
                    selectedPath={selectedPath}
                    onFileSelect={onFileSelect}
                />
            ))}
        </div>
    );
}

export function FileBrowser({ giteaOwner, giteaRepo }: FileBrowserProps) {
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileLoading, setFileLoading] = useState(false);

    const fetchTree = useCallback(async () => {
        if (!giteaOwner || !giteaRepo) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/gitea/tree?owner=${giteaOwner}&repo=${giteaRepo}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch file tree');
            }
            const data = await res.json();
            setTree(buildTree(data.tree || []));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [giteaOwner, giteaRepo]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const handleFileSelect = async (path: string) => {
        setSelectedPath(path);
        setFileContent(null);
        setFileLoading(true);

        try {
            const res = await fetch(
                `/api/gitea/file?owner=${giteaOwner}&repo=${giteaRepo}&path=${encodeURIComponent(path)}`
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch file');
            }
            const text = await res.text();
            setFileContent(text);
        } catch (err: any) {
            setFileContent(`Error loading file: ${err.message}`);
        } finally {
            setFileLoading(false);
        }
    };

    if (!giteaOwner || !giteaRepo) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <FolderGit2 size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No Repository Connected</p>
                    <p className="mt-1 text-xs text-gray-400 max-w-sm">
                        This project does not have a Gitea repository configured.
                        An admin can link a repository in the project settings.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="rounded-full bg-red-50 p-4 mb-4">
                        <AlertCircle size={24} className="text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-red-600">Failed to load repository</p>
                    <p className="mt-1 text-xs text-gray-400 max-w-sm">{error}</p>
                    <button
                        onClick={fetchTree}
                        className="mt-4 rounded-md bg-[#242424] px-3 py-1.5 text-xs text-white hover:bg-[#242424]/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Repo header */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                <FolderGit2 size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                    {giteaOwner}/{giteaRepo}
                </span>
            </div>

            <div className="flex h-[600px]">
                {/* File tree sidebar */}
                <div className="w-64 shrink-0 border-r border-gray-100 overflow-y-auto p-2">
                    {tree.map(node => (
                        <TreeItem
                            key={node.path}
                            node={node}
                            depth={0}
                            selectedPath={selectedPath}
                            onFileSelect={handleFileSelect}
                        />
                    ))}
                </div>

                {/* File content */}
                <div className="flex-1 overflow-auto">
                    {!selectedPath ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-xs text-gray-400">Select a file to view its contents</p>
                        </div>
                    ) : fileLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="relative">
                            {/* File header */}
                            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm px-4 py-2">
                                {getFileIcon(selectedPath.split('/').pop() || '')}
                                <span className="text-xs font-medium text-gray-700">{selectedPath}</span>
                            </div>
                            {/* Code content */}
                            <pre className="p-4 text-xs leading-relaxed text-gray-700 font-mono overflow-x-auto">
                                <code>{fileContent}</code>
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
