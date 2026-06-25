import React from 'react';
import { 
    Heart, 
    MessageSquare, 
    Share2, 
    Trash2, 
    Music,
    Repeat2,
    BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import { LocalMediaRender } from './LocalMediaRender';
import { Post as PostType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UserAvatar from './UserAvatar';

interface PostProps {
    post: PostType;
    currentUser: any;
    isLiked: boolean;
    onLike: (postId: string) => void;
    onComment: (postId: string) => void;
    onDelete?: (postId: string) => void;
    onShare: (post: PostType) => void;
}

const Post: React.FC<PostProps> = ({ post, currentUser, isLiked, onLike, onComment, onDelete, onShare }) => {
    return (
        <motion.article 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="post-card glass-card relative overflow-hidden"
            style={{ padding: '20px', marginBottom: '1px', borderBottom: '1px solid var(--glass-border)', borderRadius: '0' }}
        >
            <div className="flex gap-4">
                <div className="shrink-0">
                    <UserAvatar 
                        uid={post.authorId}
                        fallbackPhoto={post.authorPhoto || ""}
                        fallbackName={post.authorName || "Estudante"}
                        size={48}
                        className="rounded-full object-cover border border-glass-border"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-black dark:text-white truncate">{post.authorName}</span>
                            <span className="text-slate-500 text-sm truncate">@{post.authorHandle || (post.authorName?.toLowerCase().replace(/\s/g, ''))}</span>
                            <span className="text-slate-500 text-sm">•</span>
                            <span className="text-slate-500 text-sm whitespace-nowrap">
                                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: false, locale: ptBR }) : 'agora'}
                            </span>
                        </div>
                        {currentUser?.uid === post.authorId && onDelete && (
                            <button onClick={() => onDelete(post.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <p className="text-[15px] leading-relaxed text-black dark:text-zinc-200 mb-3 whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {post.imageURLs && post.imageURLs.length > 0 ? (
                        <div className={`grid ${post.imageURLs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
                            {post.imageURLs.map((url, idx) => (
                                <div key={idx} className="rounded-2xl overflow-hidden border border-glass-border aspect-square sm:aspect-video">
                                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                            ))}
                        </div>
                    ) : post.imageURL ? (
                        <div className="rounded-2xl overflow-hidden border border-glass-border mb-3 max-h-[500px]">
                            <img src={post.imageURL} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                        </div>
                    ) : null}

                    {/* Actions (Twitter Style) */}
                    <div className="flex items-center justify-between max-w-md mt-4 text-slate-500">
                        <button 
                            onClick={() => onComment(post.id)}
                            className="flex items-center gap-2 group hover:text-accent-1 transition-all"
                        >
                            <div className="p-2 rounded-full group-hover:bg-accent-1/10 transition-all">
                                <MessageSquare size={18} />
                            </div>
                            <span className="text-xs font-bold">{post.commentsCount || 0}</span>
                        </button>

                        <button className="flex items-center gap-2 group hover:text-emerald-500 transition-all">
                            <div className="p-2 rounded-full group-hover:bg-emerald-500/10 transition-all">
                                <Repeat2 size={18} />
                            </div>
                            <span className="text-xs font-bold">0</span>
                        </button>

                        <button 
                            onClick={() => onLike(post.id)}
                            className={`flex items-center gap-2 group transition-all ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                        >
                            <div className={`p-2 rounded-full transition-all ${isLiked ? 'bg-rose-500/10' : 'group-hover:bg-rose-500/10'}`}>
                                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                            </div>
                            <span className="text-xs font-bold">{post.likesCount || 0}</span>
                        </button>

                        <button className="flex items-center gap-2 group hover:text-accent-1 transition-all">
                            <div className="p-2 rounded-full group-hover:bg-accent-1/10 transition-all">
                                <BarChart2 size={18} />
                            </div>
                            <span className="text-xs font-bold">1.2K</span>
                        </button>

                        <button 
                            onClick={() => onShare(post)}
                            className="flex items-center group hover:text-accent-1 transition-all"
                        >
                            <div className="p-2 rounded-full group-hover:bg-accent-1/10 transition-all">
                                <Share2 size={18} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

export default Post;
