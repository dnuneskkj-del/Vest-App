import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Post as PostType } from '../types';
import { knowledgeAreas } from '../constants';

export const useTrendingData = (currentUser: any) => {
    const [trendingSubjects, setTrendingSubjects] = useState<any[]>([]);
    const [topTrendingPhotos, setTopTrendingPhotos] = useState<PostType[]>([]);
    const [topTrendingPosts, setTopTrendingPosts] = useState<PostType[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        // Trending Subjects
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('likesCount', 'desc'), limit(100));
        
        const unsubPosts = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PostType[];
            
            const subjectScores: Record<string, number> = {};
            posts.forEach(post => {
                if (post.subject) {
                    const score = (post.likesCount || 0) + (post.commentsCount || 0);
                    subjectScores[post.subject] = (subjectScores[post.subject] || 0) + score;
                }
            });

            let trends = Object.entries(subjectScores)
                .map(([name, score]) => {
                    const area = knowledgeAreas.find(a => a.subjects.includes(name));
                    return { name, score, category: area?.name || 'Geral' };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 8);
            
            if (trends.length < 5) {
                const defaultSubjects = [
                    { name: "Redação", score: 10, category: "Redação" },
                    { name: "Português", score: 8, category: "Linguagens" },
                    { name: "Matemática", score: 7, category: "Matemática" },
                    { name: "História", score: 6, category: "Humanas" },
                    { name: "Biologia", score: 5, category: "Natureza" },
                    { name: "Geografia", score: 4, category: "Humanas" },
                    { name: "Literatura", score: 3, category: "Linguagens" },
                    { name: "Química", score: 2, category: "Natureza" }
                ];
                
                const existingNames = new Set(trends.map(t => t.name));
                for (const defSubject of defaultSubjects) {
                    if (!existingNames.has(defSubject.name)) {
                        trends.push(defSubject);
                        existingNames.add(defSubject.name);
                    }
                    if (trends.length >= 6) break;
                }
            }
            
            setTrendingSubjects(trends);
            setTopTrendingPhotos(posts.filter(p => p.imageURL && p.type === 'image').slice(0, 6));
            setTopTrendingPosts(posts.slice(0, 5));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));

        // Online Users
        const usersRef = collection(db, 'users');
        const onlineQ = query(usersRef, where('status', '==', 'online'), limit(10));
        
        const unsubUsers = onSnapshot(onlineQ, (snapshot) => {
            let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            
            // Ensure the current user is included in the online list to confirm they are active
            if (currentUser && !users.some(u => u.id === currentUser.uid)) {
                users.unshift({
                    id: currentUser.uid,
                    displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Estudante",
                    photoURL: currentUser.photoURL || "",
                    level: 1,
                    status: 'online'
                });
            }
            setOnlineUsers(users);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

        return () => {
            unsubPosts();
            unsubUsers();
        };
    }, [currentUser]);

    return { trendingSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers };
};
