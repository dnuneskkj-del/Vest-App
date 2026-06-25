import React, { useState, useEffect, useRef } from "react";
import { safeLocalStorage } from '../lib/storage';
import { motion, AnimatePresence } from "motion/react";
import {
  auth,
  db,
  storage,
  handleFirestoreError,
  OperationType,
  updatePresence,
  onAuthStateChanged,
} from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  getDoc,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { toast } from "sonner";
import Layout from "../components/Layout";
import ProfileOverlay from "../components/ProfileOverlay";
import {
  UserProfile,
  Post as PostType,
  Comment as CommentType,
} from "../types";
import UserAvatar from "../components/UserAvatar";
import { knowledgeAreas, getPhraseOfTheDay } from "../constants";
import {
  Heart,
  MessageSquare,
  MoreVertical,
  Send,
  Search,
  Users,
  Video,
  Image as ImageIcon,
  FileText,
  Play,
  LayoutGrid,
  Plus,
  BookOpen,
  Trash2,
  Calculator,
  Leaf,
  Globe,
  PenTool,
  Zap,
  TrendingUp,
  User as UserIcon,
  Award,
  Bot,
  Feather,
  Layers,
  X,
  Repeat,
  Share2,
  Tv,
  Book,
  Film,
  Music,
  ExternalLink,
  Info,
  ChevronDown,
  CheckCircle,
  Brain,
  ChevronRight,
  ChevronLeft,
  MapPin,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { saveMediaLocal, getMediaLocal } from "../lib/idb";
import { LocalMediaRender } from "../components/LocalMediaRender";
import KnowledgeSidebar from "../components/KnowledgeSidebar";
import TrendsSidebar from "../components/TrendsSidebar";
import { useTrendingData } from "../hooks/useTrendingData";
import { useDraggableScroll } from "../hooks/useDraggableScroll";
import { ShareModal } from "../components/ShareModal";

const UserDisplay = ({
  uid,
  fallbackName,
  fallbackPhoto,
  fallbackHandle,
  showHandle = false,
  size = "32px",
  className = "",
  textClassName = "",
  onlyAvatar = false,
  children,
}: {
  uid: string;
  fallbackName?: string;
  fallbackPhoto?: string;
  fallbackHandle?: string;
  showHandle?: boolean;
  size?: string;
  className?: string;
  textClassName?: string;
  onlyAvatar?: boolean;
  children?: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, [uid]);

  const photo =
    profile?.photoURL ||
    fallbackPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || fallbackName || "Estudante")}&background=random`;
  const name = profile?.displayName || fallbackName || "Estudante";
  const handle = profile?.handle || fallbackHandle || "estudante";

  if (onlyAvatar) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent("open-profile", { detail: { uid } }),
          );
        }}
        className={`shrink-0 group/avatar relative ${className}`}
      >
        <img
          src={photo}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
          referrerPolicy="no-referrer"
          alt={name}
          className="group-hover:ring-2 group-hover:ring-accent-1 transition-all"
        />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent("open-profile", { detail: { uid } }),
          );
        }}
        className="shrink-0 group/avatar relative"
      >
        <img
          src={photo}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
          referrerPolicy="no-referrer"
          alt={name}
          className="group-hover:ring-2 group-hover:ring-accent-1 transition-all border border-slate-200 dark:border-zinc-800"
        />
      </button>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("open-profile", { detail: { uid } }),
              );
            }}
            className={`text-left hover:underline font-bold text-black dark:text-white truncate ${textClassName}`}
          >
            {name}
          </button>
          {(() => {
            const h = handle.toLowerCase().trim();
            if (h === "_giu.conti") {
              return (
                <span title="Verificado" className="inline-flex">
                  <CheckCircle
                    size={14}
                    className="shrink-0"
                    style={{ color: "#fbbf24" }}
                  />
                </span>
              );
            }
            if (h === "victordossantos2103") {
              return (
                <span title="Verificado" className="inline-flex">
                  <CheckCircle
                    size={14}
                    className="shrink-0"
                    style={{ color: "#3b82f6" }}
                  />
                </span>
              );
            }
            if (h === "giulia") {
              return (
                <span title="Verificado" className="inline-flex">
                  <CheckCircle
                    size={14}
                    className="shrink-0"
                    style={{ color: "#10b981" }}
                  />
                </span>
              );
            }
            if (h === "dnuneskkj") {
              return (
                <span title="Verificado" className="inline-flex">
                  <CheckCircle
                    size={14}
                    className="shrink-0"
                    style={{ color: "#ec4899" }}
                  />
                </span>
              );
            }
            if (profile?.isVerified) {
              return (
                <span title="Verificado" className="inline-flex">
                  <CheckCircle
                    size={14}
                    className="text-accent-1 shrink-0"
                  />
                </span>
              );
            }
            return null;
          })()}
        </div>
        {showHandle && (
          <span className="text-[10px] font-black text-accent-1 uppercase truncate">
            @{handle}
          </span>
        )}
        {children}
      </div>
    </div>
  );
};

const Feed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: '', title: '', text: '' });
  const { trendingSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers } =
    useTrendingData(currentUser);
  const dragScroll = useDraggableScroll<HTMLDivElement>();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (posts.length > 0) {
      // Calculate recent activity
      const activity = posts.slice(0, 5).map((post) => ({
        id: post.id,
        user: post.authorName,
        action:
          post.type === "video"
            ? "compartilhou um vídeo"
            : post.type === "image"
              ? "postou uma foto"
              : "escreveu uma nota",
        subject: post.subject,
        time: post.createdAt,
      }));
      setRecentActivity(activity);
    }
  }, [posts]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [newPostVideo, setNewPostVideo] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState(0);
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<File[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostVideos, setNewPostVideos] = useState<string[]>([]);
  const [newPostSubject, setNewPostSubject] = useState("");
  const [postType, setPostType] = useState<"text" | "image" | "video">("text");
  const [filter, setFilter] = useState("Todos");
  const [activeArea, setActiveArea] = useState("Geral");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    subjects: string[];
    posts: PostType[];
  }>({ users: [], subjects: [], posts: [] });
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likersModalPostId, setLikersModalPostId] = useState<string | null>(
    null,
  );
  const [likers, setLikers] = useState<any[]>([]);
  const [isLoadingLikers, setIsLoadingLikers] = useState(false);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, CommentType[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [postViewMode, setPostViewMode] = useState<
    Record<string, "text" | "image" | "video">
  >({});
  const [selectedTrend, setSelectedTrend] = useState<{
    name: string;
    category: string;
    price: string;
    change: string;
  } | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [postComments, setPostComments] = useState<CommentType[]>([]);
  const [activeTrendView, setActiveTrendView] = useState<{
    name: string;
    category: string;
  } | null>(null);
  const [trendTab, setTrendTab] = useState<
    "tudo" | "posts" | "videos" | "fotos" | "repertórios"
  >("tudo");
  const [communityHighlight, setCommunityHighlight] = useState<PostType | null>(
    null,
  );

  const [repostMenuPostId, setRepostMenuPostId] = useState<string | null>(null);
  const [quoteModalPost, setQuoteModalPost] = useState<PostType | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);

  // Mention / Tag tagging states
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [commentMentionPostId, setCommentMentionPostId] = useState<
    string | null
  >(null);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalCommentMentionOpen, setModalCommentMentionOpen] = useState(false);

  useEffect(() => {
    const fetchMentionUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as any,
        );

        const rawTerm = mentionSearchTerm.trim().toLowerCase();
        const clean = rawTerm.startsWith("@") ? rawTerm.slice(1) : rawTerm;

        if (clean.length > 0) {
          const filtered = list.filter((u) => {
            const name = (u.displayName || "").toLowerCase();
            const handle = (u.handle || "").toLowerCase();
            return name.includes(clean) || handle.includes(clean);
          });
          setMatchingUsers(filtered.slice(0, 10));
        } else {
          setMatchingUsers(list.slice(0, 10));
        }
      } catch (e) {
        console.error("Erro ao buscar usuários para menção:", e);
      }
    };
    fetchMentionUsers();
  }, [mentionSearchTerm]);

  const parseMentionsAndNotify = async (text: string, postId?: string) => {
    if (!text) return;
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    mentionRegex.lastIndex = 0;
    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match);
    }
    const mentionedHandles = matches.map((m) => m[1].toLowerCase());

    const uniqueHandles = [...new Set(mentionedHandles)].filter(
      (h) => h !== (userProfile?.handle || "").toLowerCase(),
    );

    for (const handle of uniqueHandles) {
      try {
        const q = query(collection(db, "users"), where("handle", "==", handle));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const recipientId = snap.docs[0].id;
          const cleanTextMsg = text.replace(/@[a-zA-Z0-9_.]+/g, "").trim();
          const snippet = cleanTextMsg
            ? `"${cleanTextMsg.substring(0, 30)}${cleanTextMsg.length > 30 ? "..." : ""}"`
            : "uma publicação";
          await createNotification(
            recipientId,
            "comment",
            postId,
            `mencionou você: ${snippet}`,
          );
        }
      } catch (err) {
        console.error("Erro ao notificar usuário mencionado:", err);
      }
    }
  };

  const renderContentWithMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_.]+|#[a-zA-Z0-9_À-ÿ\-]+)/g);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith("@")) {
            const handle = part.substring(1);
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("open-profile", { detail: { handle } }),
                  );
                }}
                className="text-accent-1 hover:underline cursor-pointer font-black"
              >
                {part}
              </span>
            );
          }
          if (part.startsWith("#")) {
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearch(part);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sky-400 hover:underline cursor-pointer font-extrabold"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </>
    );
  };

  useEffect(() => {
    if (activeTrendView && posts.length > 0) {
      const subjectPosts = posts.filter(
        (p) => p.subject === activeTrendView.name,
      );
      if (subjectPosts.length > 0) {
        const topPost = [...subjectPosts].sort(
          (a, b) => (b.likesCount || 0) - (a.likesCount || 0),
        )[0];
        setCommunityHighlight(topPost);
      } else {
        setCommunityHighlight(null);
      }
    }
  }, [activeTrendView, posts]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const filterParam = params.get("filter");

    if (searchParam) {
      setSearchTerm(searchParam);
      handleSearch(searchParam);
    }
    if (filterParam) {
      setFilter(filterParam);
      const area = knowledgeAreas.find((a) => a.subjects.includes(filterParam));
      if (area) setActiveArea(area.name);
    }
  }, [location.search]);
  const [exploringItem, setExploringItem] = useState<{
    type: string;
    title: string;
    desc: string;
    synopsis: string;
    whereToWatch: string;
    image: string;
    crowTip: string;
    externalLink: string;
    usage: { intro: string; dev: string; conc: string };
    motivationalTexts?: { title: string; content: string; source: string }[];
  } | null>(null);

  const recommendations: Record<
    string,
    {
      theme: string;
      items: {
        type:
          | "Filme"
          | "Série"
          | "Documentário"
          | "Música"
          | "Livro"
          | "Conceito"
          | "Tema";
        title: string;
        desc: string;
        synopsis: string;
        whereToWatch: string;
        image: string;
        crowTip: string;
        externalLink: string;
        usage: { intro: string; dev: string; conc: string };
        motivationalTexts?: {
          title: string;
          content: string;
          source: string;
        }[];
      }[];
    }[]
  > = {
    Redação: [
      {
        theme: "Ancestralidade e Identidade Brasileira",
        items: [
          {
            type: "Livro",
            title: "Torto Arado",
            desc: "Resistência quilombola e a força da terra.",
            synopsis:
              "Uma saga familiar no sertão baiano que explora a herança da escravidão e a luta secular dos trabalhadores rurais pela dignidade.",
            whereToWatch: "Livrarias",
            image:
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
            crowTip:
              "Obra prima! Use para falar sobre a persistência de abismos sociais e a relação espiritual com o território.",
            externalLink: "#",
            usage: {
              intro:
                "Inicie citando a obra de Itamar Vieira Junior para ilustrar a permanência de estruturas coloniais no campo brasileiro.",
              dev: "Argumente sobre a invisibilidade das populações quilombolas e a dívida histórica do Estado com essas comunidades.",
              conc: "Proponha o fortalecimento de políticas de regularização fundiária e valorização da cultura afro-brasileira.",
            },
          },
          {
            type: "Documentário",
            title: "AmarElo - É Tudo Pra Ontem",
            desc: "O legado do Movimento Negro Nacional.",
            synopsis:
              "Emicida traça um paralelo entre o samba, o rap e a história do Brasil, celebrando heróis negros esquecidos pela historiografia oficial.",
            whereToWatch: "Netflix",
            image:
              "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop",
            crowTip:
              "Fundamental! Use para discutir reparação histórica e a potência da arte como ferramenta de educação política.",
            externalLink: "https://www.netflix.com/title/81156179",
            usage: {
              intro:
                "Cite o documentário para destacar a importância de recontar a história do Brasil sob a perspectiva das minorias.",
              dev: "Analise como a exclusão de negros de espaços de prestígio, como o Theatro Municipal, é um reflexo do racismo estrutural.",
              conc: "Sugira a revisão dos currículos escolares para incluir nomes e movimentos citados por Emicida.",
            },
          },
        ],
      },
      {
        theme: "Ecologia e Saberes Originários",
        items: [
          {
            type: "Livro",
            title: "A Queda do Céu",
            desc: "Davi Kopenawa e a cosmologia Yanomami.",
            synopsis:
              'Um alerta sobre a destruição da floresta e uma crítica profunda à obsessão do "homem branco" por mercadorias e lucros.',
            whereToWatch: "Companhia das Letras",
            image:
              "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
            crowTip:
              'Potência máxima! Use para o contraste entre o "progresso" predatório e a preservação vital dos povos indígenas.',
            externalLink: "#",
            usage: {
              intro:
                'Apresente o conceito de "comedores de terra" de Kopenawa para criticar o modelo de desenvolvimento atual.',
              dev: "Discuta a ineficácia das políticas ambientais que não consideram os xamãs e guardiões da floresta.",
              conc: "Defenda a demarcação de terras indígenas como a barreira mais eficiente contra o colapso climático.",
            },
          },
          {
            type: "Documentário",
            title: "Nosso Planeta",
            desc: "A fragilidade dos ecossistemas globais.",
            synopsis:
              "Imagens que mostram a interdependência de todas as formas de vida e os danos irreversíveis das mudanças climáticas.",
            whereToWatch: "Netflix",
            image: "https://picsum.photos/seed/nature1/800/1200",
            crowTip:
              "Visualmente chocante. Perfeito para temas sobre responsabilidade intergeracional e perda de biodiversidade.",
            externalLink: "https://www.netflix.com/title/80049832",
            usage: {
              intro:
                "Utilize as cenas de degradação do degelo polar para ilustrar a urgência da crise ambiental.",
              dev: "Aborde como a extinção de espécies compromete o equilíbrio necessário para a própria sobrevivência humana.",
              conc: "Proponha acordos internacionais vinculativos que priorizem a regeneração de biomas nativos.",
            },
          },
        ],
      },
      {
        theme: "Dilemas da Modernidade Fluida",
        items: [
          {
            type: "Conceito",
            title: "Modernidade Líquida",
            desc: "Zygmunt Bauman e a fragilidade dos laços.",
            synopsis:
              "A teoria de que na sociedade atual tudo é temporário, desde relações até verdades, gerando ansiedade e falta de propósito.",
            whereToWatch: "Sociologia Clássica",
            image:
              "https://images.unsplash.com/photo-1516339901600-2e1a6298ed30?q=80&w=800&auto=format&fit=crop",
            crowTip:
              "Coringa! Explica desde o vício em redes sociais até a precarização do trabalho e do amor.",
            externalLink: "#",
            usage: {
              intro:
                "Use Bauman para introduzir a ideia de que vivemos em tempos de relações descartáveis e consumo imediato.",
              dev: "Conecte a liquidez das instituições com a crescente crise de saúde mental entre os jovens.",
              conc: "Sugira o fortalecimento de redes de apoio solidário para mitigar o isolamento da era líquida.",
            },
          },
          {
            type: "Série",
            title: "Black Mirror",
            desc: "Ética e o avanço tecnológico desenfreado.",
            synopsis:
              "Uma análise sombria de como gadgets e algoritmos podem corromper a empatia e a liberdade humana.",
            whereToWatch: "Netflix",
            image: "https://picsum.photos/seed/blackmirror/800/1200",
            crowTip:
              "Efeito distópico! Ideal para falar sobre vigilância digital, cancelamento e privacidade.",
            externalLink: "https://www.netflix.com/title/70264888",
            usage: {
              intro:
                "Contextualize a série como um espelho das patologias sociais amplificadas pela tecnologia.",
              dev: 'Examine como a busca por validação em "likes" pode destruir a integridade da psique humana.',
              conc: "Defenda a regulação algorítmica e a educação voltada para o uso consciente das telas.",
            },
          },
        ],
      },
      {
        theme: "Temas Anteriores do ENEM",
        items: [
          {
            type: "Tema",
            title: "Invisibilidade e Registro Civil (ENEM 2021)",
            desc: "Garantia de acesso à cidadania no Brasil.",
            synopsis:
              "O tema abordou a importância do registro civil para que os indivíduos sejam reconhecidos pelo Estado e tenham acesso a serviços básicos, como saúde e educação.",
            whereToWatch: "Provas Anteriores",
            image:
              "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop",
            crowTip:
              'Lembre-se da "Cidadania de Papel" de Gilberto Dimenstein – direitos que existem na lei, mas não na prática.',
            externalLink: "#",
            usage: {
              intro:
                "Apresente o conceito de cidadania de papel para mostrar o abismo entre a lei e a realidade.",
              dev: "Discuta as consequências sociais (falta de acesso ao SUS e matrículas) da ausência do registro civil no país.",
              conc: "Proponha mutirões itinerantes para emissão de documentos em regiões periféricas.",
            },
            motivationalTexts: [
              {
                title: "Texto I",
                content:
                  "\"A certidão de nascimento é o primeiro documento que reconhece que existimos e que, portanto, somos um sujeito de direitos, perante o Estado e a sociedade. É o nosso 'passaporte de entrada' para a cidadania.\"",
                source: "UNICEF Brasil",
              },
              {
                title: "Texto II",
                content:
                  "No Brasil, milhares de pessoas não têm registro civil. A invisibilidade atinge principalmente populações de baixa renda e moradores de áreas remotas.",
                source: "IBGE (Adaptado)",
              },
              {
                title: "Texto III",
                content:
                  "A falta de documento impede o acesso a benefícios sociais. A pessoa sem identidade não pode se matricular na escola, não existe nos cadastros de saúde e não pode emitir carteira de trabalho.",
                source: "G1 Notícias (Adaptado)",
              },
            ],
          },
          {
            type: "Tema",
            title: "Democratização do Acesso ao Cinema (ENEM 2019)",
            desc: "O cinema como direito cultural.",
            synopsis:
              "Discutiu como a concentração das salas de cinema em shoppings de grandes centros urbanos limita o acesso à cultura para a população de baixa renda e do interior.",
            whereToWatch: "Provas Anteriores",
            image:
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
            crowTip:
              "Use a Declaração Universal dos Direitos Humanos para defender que cultura e lazer são direitos básicos.",
            externalLink: "#",
            usage: {
              intro:
                "Afirme que o cinema é um direito cultural, conforme previsto na Constituição e em Declarações Internacionais.",
              dev: "Aborde o processo de elitização dos espaços de exibição cinematográfica no Brasil, focados em grandes shoppings.",
              conc: "Sugira ao Ministério da Cultura a expansão de editais para cinemas de rua e cineclubes comunitários.",
            },
            motivationalTexts: [
              {
                title: "Texto I",
                content:
                  '"Toda pessoa tem o direito de participar livremente da vida cultural da comunidade, de fruir as artes e de participar do progresso científico e de seus benefícios."',
                source: "Art. 27, Declaração Universal dos Direitos Humanos",
              },
              {
                title: "Texto II",
                content:
                  "A maior parte das salas de cinema no Brasil encontra-se nos grandes centros urbanos, e o custo do ingresso afasta a população periférica.",
                source: "Ancine",
              },
              {
                title: "Texto III",
                content:
                  "A cultura fomenta não apenas o lazer, mas a formação crítica de um povo. O cinema é espelho social e ferramenta de educação invisível.",
                source: "Especialista em Audiovisual",
              },
            ],
          },
        ],
      },
      {
        theme: "Questões Sociais em Foco",
        items: [
          {
            type: "Tema",
            title: "Envelhecimento da População",
            desc: "Desafios do Brasil que fica cada vez mais velho.",
            synopsis:
              "Com o aumento da expectativa de vida e queda na taxa de natalidade, o país enfrenta desafios na previdência, na saúde pública e na integração social do idoso.",
            whereToWatch: "Temas Atuais",
            image:
              "https://images.unsplash.com/photo-1502444391264-b1f41eff3ab3?q=80&w=800&auto=format&fit=crop",
            crowTip:
              "Idadismo (ou etarismo) é uma palavra-chave excelente! Mostrar como os idosos são marginalizados socialmente conta muitos pontos.",
            externalLink: "#",
            usage: {
              intro:
                "Inicie com a transição demográfica brasileira, mostrando que o país deixará de ser jovem em pouco tempo.",
              dev: 'Explore a sobrecarga do sistema de saúde (SUS) e o aumento do "etarismo" no mercado de trabalho.',
              conc: "Proponha a criação de centros de convivência intergeracional e subsídios para contratação de profissionais 60+.",
            },
            motivationalTexts: [
              {
                title: "Texto I",
                content:
                  '"O envelhecimento populacional é uma das tendências mais significativas do século XXI. Tem implicações importantes para quase todos os setores da sociedade."',
                source: "ONU",
              },
              {
                title: "Texto II",
                content:
                  "O etarismo, preconceito baseado na idade, afeta a saúde mental de idosos e impede sua reinserção no mercado de trabalho formal.",
                source: "Artigo Científico",
              },
              {
                title: "Texto III",
                content:
                  "Com a mudança da pirâmide etária, as políticas públicas precisam estar voltadas para doenças crônicas e readaptação urbana.",
                source: "Especialista Demográfico",
              },
            ],
          },
        ],
      },
    ],
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Logged in user:", user.email, user.uid);

        // Ensure user profile exists
        await loadUserProfile(user.uid);

        // Listen to user profile changes in real-time
        const userRef = doc(db, "users", user.uid);
        const unsubscribeProfile = onSnapshot(
          userRef,
          (doc) => {
            if (doc.exists()) {
              setUserProfile(doc.data() as UserProfile);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          },
        );

        updatePresence("online");

        const handleUnload = () => updatePresence("offline");
        window.addEventListener("beforeunload", handleUnload);

        return () => {
          window.removeEventListener("beforeunload", handleUnload);
          unsubscribeProfile();
        };
      } else {
        navigate("/");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const loadUserProfile = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        const userData = {
          uid: uid,
          displayName: auth.currentUser?.displayName || "Estudante",
          photoURL: auth.currentUser?.photoURL || "",
          email: auth.currentUser?.email || "",
          avatarEdited: false,
          handle: auth.currentUser?.email
            ? auth.currentUser.email.split("@")[0]
            : `user_${uid.substring(0, 5)}`,
          bio: "Focado nos estudos! 🚀",
          level: 1,
          xp: 0,
          followersCount: 0,
          followingCount: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
        return userData;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  };

  useEffect(() => {
    // Feed loading for both users and visitors
    // Fetch newest 300 posts chronologically without where clause to avoid index requirement
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(300),
    );

    const unsubscribeFeed = onSnapshot(
      q,
      (snapshot) => {
        const postList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Handle fallback if database createdAt is not yet resolved locally
            createdAt: data.createdAt || null,
          };
        });

        // Set posts synchronously first to keep the app snappy
        setPosts(postList as PostType[]);

        // Try to fetch missing original posts for reposts or quotes asynchronously
        const enrichPosts = async () => {
          const enriched = await Promise.all(postList.map(async (p: any) => {
            const post = p;
            const targetId = post.repostOfId || post.quoteOfId;
            if (targetId && !post.originalPost) {
              const localOriginal = postList.find((x) => x.id === targetId);
              if (localOriginal) {
                return { ...post, originalPost: localOriginal };
              }
              try {
                const originalDoc = await getDoc(doc(db, "posts", targetId));
                if (originalDoc.exists()) {
                  return {
                    ...post,
                    originalPost: { id: originalDoc.id, ...originalDoc.data() }
                  };
                }
              } catch (e) {
                console.error("Could not fetch original post in Feed snapshot:", e);
              }
            }
            return post;
          }));
          setPosts(enriched as PostType[]);
        };
        enrichPosts();
      },
      (error) => {
        console.error("Erro ao carregar feed:", error);
        // Handle error silently or with a non-blocking toast
      },
    );

    return () => unsubscribeFeed();
  }, []); // No dependencies needed anymore since we filter client-side!

  useEffect(() => {
    if (!currentUser) {
      setLikedPosts(new Set());
      return;
    }

    const q = query(
      collection(db, "likes"),
      where("userId", "==", currentUser.uid),
    );
    const unsubscribeLikes = onSnapshot(
      q,
      (snapshot) => {
        const likedIds = new Set<string>();
        snapshot.docs.forEach((doc) => {
          likedIds.add(doc.data().postId);
        });
        setLikedPosts(likedIds);
      },
      (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, "likes");
        }
      },
    );

    return () => unsubscribeLikes();
  }, [currentUser]);

  const openPostModal = (post: PostType) => {
    setSelectedPost(post);
    // Load comments for the modal
    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "asc"),
    );
    onSnapshot(
      q,
      (snapshot) => {
        const commentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CommentType[];
        setPostComments(commentList);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `posts/${post.id}/comments`,
        );
      },
    );
  };

  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const subjectListRef = useRef<HTMLDivElement>(null);
  const publishButtonRef = useRef<HTMLButtonElement>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      toast.info(`Iniciando processamento de ${files.length} imagem(ns)...`);
      files.forEach((file, index) => {
        setSelectedImageFiles((prev) => [...prev, file]);
        if (index === 0) {
          setSelectedImageFile(file); // fallback for legacy
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const rawBase64 = event.target.result as string;
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 2048;
              const MAX_HEIGHT = 2048;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL("image/jpeg", 0.85);
                setNewPostImages((prev) => [...prev, compressed]);
                if (index === 0) {
                  setNewPostImage(compressed); // legacy
                }
              } else {
                setNewPostImages((prev) => [...prev, rawBase64]);
                if (index === 0) {
                  setNewPostImage(rawBase64); // legacy
                }
              }
            };
            img.onerror = () => {
              setNewPostImages((prev) => [...prev, rawBase64]);
              if (index === 0) {
                setNewPostImage(rawBase64); // legacy
              }
            };
            img.src = rawBase64;
          }
        };
        reader.readAsDataURL(file);
      });
      toast.success("Imagens processadas e prontas com sucesso!");
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const validFiles: File[] = [];
      files.forEach((file) => {
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        validFiles.forEach((file, index) => {
          setSelectedMediaFiles((prev) => [...prev, file]);
          const objectUrl = URL.createObjectURL(file);
          setNewPostVideos((prev) => [...prev, objectUrl]);

          if (index === 0) {
            setSelectedFileName(file.name);
            setSelectedFileSize(file.size);
            setSelectedMediaFile(file);
            setNewPostVideo(objectUrl);
          }
        });
        toast.success(
          `${validFiles.length} arquivo(s) de mídia pronto(s) para publicação!`,
        );
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []) as File[];
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      toast.info(
        `Iniciando processamento de ${imageFiles.length} imagem(ns)...`,
      );
      imageFiles.forEach((file, index) => {
        setSelectedImageFiles((prev) => [...prev, file]);
        if (index === 0) {
          setSelectedImageFile(file);
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const raw = event.target.result as string;
            setNewPostImages((prev) => [...prev, raw]);
            if (index === 0) {
              setNewPostImage(raw);
            }
          }
        };
        reader.readAsDataURL(file);
      });
      toast.success("Imagem(ns) processada(s) com sucesso!");
    } else {
      toast.error(
        "Gostaria de enviar fotos? Arraste apenas arquivos de imagem aqui.",
      );
    }
  };

  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []) as File[];
    if (files.length > 0) {
      const validFiles: File[] = [];
      files.forEach((file) => {
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        validFiles.forEach((file, index) => {
          setSelectedMediaFiles((prev) => [...prev, file]);
          const objectUrl = URL.createObjectURL(file);
          setNewPostVideos((prev) => [...prev, objectUrl]);

          if (index === 0) {
            setSelectedFileName(file.name);
            setSelectedFileSize(file.size);
            setSelectedMediaFile(file);
            setNewPostVideo(objectUrl);
          }
        });
        toast.success(
          `${validFiles.length} arquivo(s) de mídia pronto(s) para publicação!`,
        );
      }
    }
  };

  const scrollToPublish = () => {
    publishButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handlePublish = async () => {
    if (!currentUser || isPublishing) return;

    const hasMedia =
      (postType === "image" &&
        (newPostImages.length > 0 ||
          !!newPostImage ||
          selectedImageFiles.length > 0 ||
          !!selectedImageFile)) ||
      (postType === "video" &&
        (newPostVideos.length > 0 ||
          !!newPostVideo ||
          selectedMediaFiles.length > 0 ||
          !!selectedMediaFile));
    if (!newPostText.trim() && !hasMedia) return;

    let finalImageURLs: string[] = [];
    let finalVideoURLs: string[] = [];

    if (hasMedia) {
      if (postType === "image") {
        const filesToUpload =
          selectedImageFiles.length > 0
            ? selectedImageFiles
            : selectedImageFile
              ? [selectedImageFile]
              : [];
        if (filesToUpload.length > 0) {
          const uploadPromises = filesToUpload.map(async (file, idx) => {
            const toastId = toast.loading(
              `Enviando foto ${idx + 1}/${filesToUpload.length} para o Ninho...`,
              {
                description: "Isso suporta qualquer tamanho de imagem!",
              },
            );
            try {
              let uploadedURL = "";
              if (storage) {
                const storageRef = ref(
                  storage,
                  `posts_images/${currentUser.uid}/${Date.now()}_${idx}_${file.name}`,
                );
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadedURL = await new Promise<string>((resolve, reject) => {
                  uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                      const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      toast.loading(
                        `Enviando foto ${idx + 1}... ${Math.round(progress)}%`,
                        {
                          id: toastId,
                          description: "Progresso em tempo real",
                        },
                      );
                    },
                    (error) => reject(error),
                    async () => {
                      try {
                        const downloadURL = await getDownloadURL(
                          uploadTask.snapshot.ref,
                        );
                        resolve(downloadURL);
                      } catch (err) {
                        reject(err);
                      }
                    },
                  );
                });
                toast.success(`Foto ${idx + 1} enviada com sucesso!`, {
                  id: toastId,
                });
              } else {
                throw new Error("Firebase Storage não disponível.");
              }
              return uploadedURL;
            } catch (storageErr: any) {
              console.warn(
                "Firebase Storage failed for image, trying server upload fallback:",
                storageErr,
              );
              toast.loading(
                `Tentando servidor local como redundância para foto ${idx + 1}...`,
                {
                  id: toastId,
                  description: "Enviando arquivo...",
                },
              );

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  const errData = await response.json().catch(() => ({}));
                  throw new Error(
                    errData.error || "Falha no upload para o servidor.",
                  );
                }

                const resData = await response.json();
                toast.success(
                  `Foto ${idx + 1} enviada com sucesso para o servidor!`,
                  { id: toastId },
                );
                return resData.url;
              } catch (uploadErr: any) {
                console.error(
                  "Erro de upload da imagem no servidor:",
                  uploadErr,
                );
                toast.error(`Erro: ` + (uploadErr.message || "Sem conexão."), {
                  id: toastId,
                });
                throw uploadErr;
              }
            }
          });

          finalImageURLs = await Promise.all(uploadPromises);
        } else {
          const otherURLs =
            newPostImages.length > 0
              ? newPostImages
              : newPostImage
                ? [newPostImage]
                : [];
          finalImageURLs = otherURLs.filter((u) => u && u.trim() !== "");
        }
      } else if (postType === "video") {
        const filesToUpload =
          selectedMediaFiles.length > 0
            ? selectedMediaFiles
            : selectedMediaFile
              ? [selectedMediaFile]
              : [];
        if (filesToUpload.length > 0) {
          const uploadPromises = filesToUpload.map(async (file, idx) => {
            const toastId = toast.loading(
              `Enviando mídia ${idx + 1}/${filesToUpload.length}...`,
              {
                description: "Isso suporta qualquer tamanho de arquivo!",
              },
            );
            try {
              let uploadedURL = "";
              if (storage) {
                const storageRef = ref(
                  storage,
                  `posts_media/${currentUser.uid}/${Date.now()}_${idx}_${file.name}`,
                );
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadedURL = await new Promise<string>((resolve, reject) => {
                  uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                      const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      toast.loading(
                        `Enviando arquivo ${idx + 1}... ${Math.round(progress)}%`,
                        {
                          id: toastId,
                          description: "Progresso de transmissão em tempo real",
                        },
                      );
                    },
                    (error) => reject(error),
                    async () => {
                      try {
                        const downloadURL = await getDownloadURL(
                          uploadTask.snapshot.ref,
                        );
                        resolve(downloadURL);
                      } catch (err) {
                        reject(err);
                      }
                    },
                  );
                });
                toast.success(
                  `Mídia ${idx + 1} enviada com sucesso para o Ninho!`,
                  { id: toastId },
                );
              } else {
                throw new Error("Firebase Storage não disponível.");
              }
              return uploadedURL;
            } catch (storageErr: any) {
              console.warn(
                "Firebase Storage failed, trying server upload fallback:",
                storageErr,
              );
              toast.loading(
                `Tentando servidor local como redundância para mídia ${idx + 1}...`,
                {
                  id: toastId,
                  description: "Enviando arquivo...",
                },
              );

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  const errData = await response.json().catch(() => ({}));
                  throw new Error(
                    errData.error || "Falha no upload para o servidor.",
                  );
                }

                const resData = await response.json();
                toast.success(
                  `Mídia ${idx + 1} enviada com sucesso para o servidor!`,
                  { id: toastId },
                );
                return resData.url;
              } catch (uploadErr: any) {
                console.error(
                  "Erro de upload de vídeo no servidor:",
                  uploadErr,
                );
                toast.error(`Erro: ` + (uploadErr.message || "Sem conexão."), {
                  id: toastId,
                });
                throw uploadErr;
              }
            }
          });

          finalVideoURLs = await Promise.all(uploadPromises);
        } else {
          const otherURLs =
            newPostVideos.length > 0
              ? newPostVideos
              : newPostVideo
                ? [newPostVideo]
                : [];
          finalVideoURLs = otherURLs.filter((u) => u && u.trim() !== "");
        }
      }
    }

    setIsPublishing(true);
    try {
      const subject = newPostSubject || (filter === "Todos" ? "Geral" : filter);
      const postData = {
        authorId: currentUser.uid,
        authorName:
          userProfile?.displayName || currentUser.displayName || "Estudante",
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || "",
        authorHandle:
          userProfile?.handle ||
          currentUser.email?.split("@")[0] ||
          "estudante",
        content: newPostText,
        imageURL: postType === "image" ? finalImageURLs[0] || null : null,
        videoURL: postType === "video" ? finalVideoURLs[0] || null : null,
        imageURLs: postType === "image" ? finalImageURLs : [],
        videoURLs: postType === "video" ? finalVideoURLs : [],
        type: postType,
        subject: subject,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "posts"), postData);
      try {
        await parseMentionsAndNotify(newPostText, docRef.id);
      } catch (mentionErr) {
        console.warn("Could not parse mentions or notify:", mentionErr);
      }
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { xp: increment(30) });
      } catch (xpErr) {
        console.warn("Could not update user XP:", xpErr);
      }
      setNewPostText("");
      setNewPostImage("");
      setNewPostVideo("");
      setNewPostImages([]);
      setNewPostVideos([]);
      setNewPostSubject("");
      setPostType("text");
      setSelectedFileName("");
      setSelectedFileSize(0);
      setSelectedMediaFile(null);
      setSelectedImageFile(null);
      setSelectedMediaFiles([]);
      setSelectedImageFiles([]);
      toast.success("Publicação enviada com sucesso! +30 XP obtidos. 🚀");
    } catch (error) {
      console.error("Erro ao publicar:", error);
      toast.error("Erro ao publicar. Verifique sua conexão ou permissões.");
      handleFirestoreError(error, OperationType.WRITE, "posts");
    } finally {
      setIsPublishing(false);
    }
  };

  const createNotification = async (
    recipientId: string,
    type: "like" | "comment" | "follow" | "repost" | "quote",
    postId?: string,
    extraText?: string,
  ) => {
    if (!currentUser || currentUser.uid === recipientId) return;

    try {
      await addDoc(collection(db, "notifications"), {
        recipientId,
        senderId: currentUser.uid,
        senderName:
          userProfile?.displayName || currentUser.displayName || "Estudante",
        senderPhoto: userProfile?.photoURL || currentUser.photoURL || "",
        type,
        postId: postId || null,
        message:
          extraText ||
          (type === "like"
            ? "curtiu sua publicação"
            : type === "comment"
              ? "comentou na sua publicação"
              : "começou a te seguir"),
        createdAt: serverTimestamp(),
        read: false,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "notifications");
    }
  };

  const handleRepost = async (post: PostType) => {
    if (!currentUser) {
      toast.error("Faça login para republicar! 🚀");
      return;
    }

    try {
      const originalId = post.repostOfId || post.id;
      const repostData = {
        authorId: currentUser.uid,
        authorName:
          userProfile?.displayName || currentUser.displayName || "Estudante",
        authorHandle:
          userProfile?.handle ||
          currentUser.email?.split("@")[0] ||
          "estudante",
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || "",
        content: "",
        repostOfId: originalId,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp(),
        subject: post.subject || "Geral",
        type: "repost",
      };
      
      await addDoc(collection(db, "posts"), repostData);

      // Optimistic reposts count update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === originalId
            ? { ...p, repostsCount: (p.repostsCount || 0) + 1 }
            : p,
        ),
      );

      // Increment repost count on original post
      await updateDoc(doc(db, "posts", originalId), {
        repostsCount: increment(1),
      }).catch((e) =>
        console.warn("Could not update repostsCount on original post", e),
      );
      setRepostMenuPostId(null);
      toast.success("Publicação republicada! 🔄");

      if (post.authorId !== currentUser.uid) {
        createNotification(post.authorId, "repost", originalId);
      }
    } catch (error) {
      console.error("Erro ao republicar:", error);
      toast.error("Ocorreu um erro ao republicar.");
    }
  };

  const handleSendQuote = async () => {
    if (!currentUser || !quoteModalPost || !quoteText.trim()) return;
    setIsQuoting(true);

    try {
      const quoteData = {
        authorId: currentUser.uid,
        authorName:
          userProfile?.displayName || currentUser.displayName || "Estudante",
        authorHandle:
          userProfile?.handle ||
          currentUser.email?.split("@")[0] ||
          "estudante",
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || "",
        content: quoteText,
        quoteOfId: quoteModalPost.id,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp(),
        subject: quoteModalPost.subject || "Geral",
        type: "quote",
      };

      await addDoc(collection(db, "posts"), quoteData);

      // Optimistic reposts count update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === quoteModalPost.id
            ? { ...p, repostsCount: (p.repostsCount || 0) + 1 }
            : p,
        ),
      );

      // Increment repost count on original post
      await updateDoc(doc(db, "posts", quoteModalPost.id), {
        repostsCount: increment(1),
      }).catch((e) =>
        console.warn("Could not update repostsCount on original post", e),
      );
      setQuoteModalPost(null);
      setQuoteText("");
      toast.success("Comentário em cima da publicação enviado! 💬🔄");

      if (quoteModalPost.authorId !== currentUser.uid) {
        createNotification(quoteModalPost.authorId, "quote", quoteModalPost.id);
      }
    } catch (error) {
      console.error("Erro ao citar post:", error);
      toast.error("Ocorreu um erro ao enviar seu comentário.");
    } finally {
      setIsQuoting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error("Faça login para curtir publicações! 🚀");
      return;
    }

    const isLiked = likedPosts.has(postId);
    const likeId = `${currentUser.uid}_${postId}`;
    const likeRef = doc(db, "likes", likeId);
    const postRef = doc(db, "posts", postId);

    // Optimistic UI update
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    // Optimistic posts count update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? -1 : 1) }
          : p,
      ),
    );

    // Update selectedPost if open in modal
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? { ...prev, likesCount: (prev.likesCount || 0) + (isLiked ? -1 : 1) }
          : null,
      );
    }

    try {
      if (isLiked) {
        try {
          await deleteDoc(likeRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `likes/${likeId}`);
        }
        try {
          await updateDoc(postRef, { likesCount: increment(-1) });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
        }
      } else {
        try {
          await setDoc(likeRef, {
            userId: currentUser.uid,
            postId: postId,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `likes/${likeId}`);
        }
        try {
          await updateDoc(postRef, { likesCount: increment(1) });
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, { xp: increment(5) });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
        }

        // Create notification
        try {
          const postSnap = await getDoc(postRef);
          if (postSnap.exists()) {
            const postData = postSnap.data();
            if (postData.authorId !== currentUser.uid) {
              createNotification(postData.authorId, "like", postId);
            }
          }
        } catch (error) {
          console.error("Error creating notification:", error);
        }
      }
    } catch (error) {
      // Revert changes on error
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? 1 : -1) }
            : p,
        ),
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likesCount: (prev.likesCount || 0) + (isLiked ? 1 : -1),
              }
            : null,
        );
      }
      // Error already handled by inner try-catch blocks
    }
  };

  const openLikersModal = async (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setLikersModalPostId(postId);
    setIsLoadingLikers(true);
    setLikers([]);

    try {
      const likesQ = query(
        collection(db, "likes"),
        where("postId", "==", postId),
        limit(100),
      );
      const likesSnap = await getDocs(likesQ);

      const userPromises = likesSnap.docs.map(async (likeDoc) => {
        const likeData = likeDoc.data();
        const userSnap = await getDoc(doc(db, "users", likeData.userId));
        return userSnap.exists()
          ? { id: likeData.userId, ...userSnap.data() }
          : null;
      });

      const resolvedUsers = (await Promise.all(userPromises)).filter(
        (u) => u !== null,
      );
      setLikers(resolvedUsers);
    } catch (error) {
      console.error("Erro ao carregar curtidas:", error);
      toast.error("Não foi possível carregar quem curtiu.");
    } finally {
      setIsLoadingLikers(false);
    }
  };

  const toggleComments = (postId: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        loadComments(postId);
      }
      return next;
    });
  };

  const loadComments = (postId: string) => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
    );
    onSnapshot(
      q,
      (snapshot) => {
        const commentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CommentType[];
        setComments((prev) => ({ ...prev, [postId]: commentList }));
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `posts/${postId}/comments`,
        );
      },
    );
  };

  const handleShare = (post: PostType) => {
    const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
    setShareData({
        url: shareUrl,
        title: `VestApp - Post de ${post.authorName}`,
        text: post.content,
    });
    setIsShareModalOpen(true);
  };

  const handleSendComment = async (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const temporaryId = `temp_${Date.now()}`;
    const newComment: CommentType = {
      id: temporaryId,
      authorId: currentUser.uid,
      authorName:
        userProfile?.displayName || currentUser.displayName || "Estudante",
      authorHandle:
        userProfile?.handle || currentUser.email?.split("@")[0] || "estudante",
      authorPhoto: userProfile?.photoURL || currentUser.photoURL || "",
      text: text,
      createdAt: new Date() as any, // Temporary date for optimistic UI
    };

    // Optimistic UI updates
    setPostComments((prev) => [...prev, newComment]);
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
          : p,
      ),
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null,
      );
    }

    try {
      const commentDocRef = await addDoc(
        collection(db, "posts", postId, "comments"),
        {
          authorId: newComment.authorId,
          authorName: newComment.authorName,
          authorHandle: newComment.authorHandle,
          authorPhoto: newComment.authorPhoto,
          text: newComment.text,
          createdAt: serverTimestamp(),
        },
      );
      await parseMentionsAndNotify(text, postId);
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
      toast.success("Comentário enviado! 💬");

      // Create notification
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        if (postData.authorId !== currentUser.uid) {
          createNotification(
            postData.authorId,
            "comment",
            postId,
            `comentou: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
          );
        }
      }
    } catch (error) {
      // Revert changes on error
      setPostComments((prev) => prev.filter((c) => c.id !== temporaryId));
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== temporaryId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) - 1 }
            : p,
        ),
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? { ...prev, commentsCount: (prev.commentsCount || 0) - 1 }
            : null,
        );
      }
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `posts/${postId}/comments`,
      );
    }
  };

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  const handleDeleteComment = async (
    postId: string,
    commentId: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    // Save current state for possible revert
    const deletedComment = postComments.find((c) => c.id === commentId);
    if (!deletedComment) return;

    // Optimistic UI updates
    setPostComments((prev) => prev.filter((c) => c.id !== commentId));
    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
          : p,
      ),
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
            }
          : null,
      );
    }

    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      await deleteDoc(commentRef);

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1),
      });

      setDeletingCommentId(null);
    } catch (error: any) {
      // Revert changes on error
      setPostComments((prev) => [...prev, deletedComment]);
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), deletedComment],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p,
        ),
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 }
            : null,
        );
      }

      handleFirestoreError(
        error,
        OperationType.DELETE,
        `posts/${postId}/comments/${commentId}`,
      );
      toast.error("Erro ao excluir comentário");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Agora";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return "Agora";
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString();
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    const cleanTerm = term.trim().toLowerCase();
    if (cleanTerm.length > 0) {
      try {
        // 1. Pesquisar usuários (Colegas)
        const userSnaps = await getDocs(
          query(collection(db, "users"), limit(50)),
        ); // Limit broad fetch
        const searchWord = cleanTerm.startsWith("@")
          ? cleanTerm.substring(1)
          : cleanTerm;

        const matchedUsers = userSnaps.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
          .filter((u) => {
            const displayName = (u.displayName || "").toLowerCase();
            const handle = (u.handle || "").toLowerCase();
            return (
              displayName.includes(searchWord) || handle.includes(searchWord)
            );
          })
          .slice(0, 10); // Mostrar top 10

        // 2. Pesquisar Temas (Subjects)
        const allSubjects = Array.from(
          new Set(knowledgeAreas.flatMap((area) => area.subjects)),
        );
        const matchedSubjects = allSubjects
          .filter((s) => s.toLowerCase().includes(searchWord))
          .slice(0, 5);

        // 3. Pesquisar Posts (Pelas palavras no conteúdo)
        const matchedPosts = posts
          .filter((p) => {
            const content = (p.content || "").toLowerCase();
            const author = (p.authorName || "").toLowerCase();
            const subject = (p.subject || "").toLowerCase();
            return (
              content.includes(searchWord) ||
              author.includes(searchWord) ||
              subject.includes(searchWord)
            );
          })
          .slice(0, 5);

        setSearchResults({
          users: matchedUsers,
          subjects: matchedSubjects,
          posts: matchedPosts,
        });
      } catch (error) {
        console.error("Erro ao pesquisar:", error);
      }
    } else {
      setSearchResults({ users: [], subjects: [], posts: [] });
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log("Iniciando exclusão do post:", postId);
    try {
      await deleteDoc(doc(db, "posts", postId));
      console.log("Post excluído com sucesso");
      toast.success("Publicação excluída com sucesso!");
      setActiveMenu(null);
      setPostToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
      toast.error("Erro ao excluir a publicação.");
    }
  };

  const getTagClass = (subject: string) => {
    if (knowledgeAreas[0].subjects.includes(subject)) return "tag-linguagens";
    if (knowledgeAreas[1].subjects.includes(subject)) return "tag-matematica";
    if (knowledgeAreas[2].subjects.includes(subject)) return "tag-natureza";
    if (knowledgeAreas[3].subjects.includes(subject)) return "tag-humanas";
    if (knowledgeAreas[4].subjects.includes(subject)) return "tag-redacao";
    return "";
  };

  const getSubjectColorStyles = (subject: string, isSelected: boolean) => {
    if (subject === "Todos") {
      return isSelected
        ? "bg-accent-1 text-slate-950 border-accent-1 shadow-md shadow-accent-1/20 font-black"
        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-700";
    }
    
    const area = knowledgeAreas.find(a => a.subjects.includes(subject));
    const areaId = area ? area.id : "";
    
    if (isSelected) {
      switch (areaId) {
        case "linguagens":
          return "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-black";
        case "matematica":
          return "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20 font-black";
        case "natureza":
          return "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-black";
        case "humanas":
          return "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20 font-black";
        case "redacao":
          return "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20 font-black";
        default:
          return "bg-accent-1 text-slate-950 border-accent-1 shadow-md shadow-accent-1/20 font-black";
      }
    } else {
      switch (areaId) {
        case "linguagens":
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-400 dark:hover:border-amber-600/50 hover:text-amber-500";
        case "matematica":
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-teal-400 dark:hover:border-teal-600/50 hover:text-teal-500";
        case "natureza":
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400 dark:hover:border-emerald-600/50 hover:text-emerald-500";
        case "humanas":
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-400 dark:hover:border-violet-600/50 hover:text-violet-500";
        case "redacao":
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-rose-400 dark:hover:border-rose-600/50 hover:text-rose-500";
        default:
          return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700";
      }
    }
  };

  return (
    <Layout>
      {/* Floating Feathers Background Elements */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="feather"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 20}s`,
          }}
        >
          <Feather
            size={22}
            className="text-accent-1/20 dark:text-accent-1/30"
          />
        </div>
      ))}

      <main id="main-layout" className="feed-grid">
        <KnowledgeSidebar
          filter={filter}
          setFilter={setFilter}
          setActiveArea={setActiveArea}
          setActiveTrendView={setActiveTrendView}
        />

        <div id="feed-container">
          <header className="feed-welcome-header mb-8 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tighter text-black dark:text-white">
                Olá,{" "}
                <span className="text-accent-1">
                  {userProfile?.displayName?.split(" ")[0] || currentUser?.displayName?.split(" ")[0] || currentUser?.email?.split("@")[0] || "Estudante"}
                </span>
                !
              </h1>
              <p className="text-sm md:text-lg text-black dark:text-zinc-300 font-extrabold tracking-wide flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                <span className="w-2.5 h-2.5 md:w-4 md:h-4 bg-accent-1 rounded-full animate-pulse shrink-0" />
                <span>PRONTO PARA MAIS UM DIA NO NINHO?</span>
              </p>
            </motion.div>
          </header>

          <section className="horizontal-trends-strip mb-8 w-full overflow-hidden select-none">
            <div className="flex items-center justify-between gap-3 mb-5 px-2">
              <span className="text-sm text-black dark:text-zinc-300 uppercase tracking-[3px] font-black">
                  Filtre por Matéria
              </span>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (dragScroll.ref.current) {
                      dragScroll.ref.current.scrollBy({ left: -280, behavior: 'smooth' });
                    }
                  }}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 active:scale-90 transition-all cursor-pointer shadow-sm"
                  title="Anterior"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dragScroll.ref.current) {
                      dragScroll.ref.current.scrollBy({ left: 280, behavior: 'smooth' });
                    }
                  }}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 active:scale-90 transition-all cursor-pointer shadow-sm"
                  title="Próximo"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div 
                ref={dragScroll.ref}
                onMouseDown={dragScroll.onMouseDown}
                onMouseLeave={dragScroll.onMouseLeave}
                onMouseUp={dragScroll.onMouseUp}
                onMouseMove={dragScroll.onMouseMove}
                className="flex overflow-x-auto overflow-y-visible gap-3 pb-4 px-2 snap-x scroll-smooth cursor-grab active:cursor-grabbing" 
                style={{ scrollbarWidth: 'none', ...dragScroll.style }}
            >
                <style>{`.horizontal-trends-strip ::-webkit-scrollbar { display: none; }`}</style>
                
                {/* Botão "Todas" */}
                <div className="snap-start shrink-0">
                    <button
                        onPointerDown={(e) => {
                            if (dragScroll.ref.current && dragScroll.ref.current.style.cursor === 'grabbing') {
                                e.preventDefault();
                            }
                        }}
                        onClick={() => {
                            if (dragScroll.ref.current && dragScroll.ref.current.style.cursor === 'grabbing') return;
                            setFilter("Todos");
                            setActiveArea("Geral");
                        }}
                        className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border-2 flex items-center gap-2 hover:scale-103 active:scale-97 cursor-pointer h-[46px]
                            ${getSubjectColorStyles("Todos", filter === "Todos")}`}
                    >
                        <LayoutGrid size={13} />
                        <span>Todas</span>
                    </button>
                </div>

                {/* Botões de disciplinas/matérias separadas */}
                {knowledgeAreas.flatMap((area) => 
                    area.subjects.map((sub) => {
                        const isSelected = filter === sub;
                        return (
                            <div key={sub} className="snap-start shrink-0">
                                <button
                                    onPointerDown={(e) => {
                                        if (dragScroll.ref.current && dragScroll.ref.current.style.cursor === 'grabbing') {
                                            e.preventDefault();
                                        }
                                    }}
                                    onClick={() => {
                                        if (dragScroll.ref.current && dragScroll.ref.current.style.cursor === 'grabbing') return;
                                        if (filter === sub) {
                                            setFilter("Todos");
                                            setActiveArea("Geral");
                                        } else {
                                            setFilter(sub);
                                            setActiveArea(area.name);
                                            setActiveTrendView({ name: sub, category: area.name });
                                            if (area.name === 'Redação') setTrendTab('repertórios');
                                            else setTrendTab('tudo');
                                        }
                                    }}
                                    className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border-2 flex items-center gap-2 hover:scale-103 active:scale-97 cursor-pointer h-[46px]
                                        ${getSubjectColorStyles(sub, isSelected)}`}
                                >
                                    <span className="flex items-center justify-center shrink-0 w-3.5 h-3.5">
                                        {area.icon}
                                    </span>
                                    <span>{sub}</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
          </section>

          <section className="flex gap-4 mb-12 relative z-40">
            <div className="relative flex-1 group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent-1 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Pesquisar posts, temas ou colegas..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-14 bg-bg-secondary border-2 border-slate-300 dark:border-zinc-800 rounded-2xl pl-14 pr-6 text-base focus:outline-none focus:border-accent-1 transition-all text-black dark:text-white placeholder-slate-950 dark:placeholder-zinc-500 font-black"
              />

              {/* NOVO: Dropdown de Resultados Multicategoria */}
              {searchTerm.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-16 bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-glass-border">
                    <span className="text-sm font-black text-text-primary uppercase tracking-[0.2em]">
                      Pesquisa do Ninho
                    </span>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSearchResults({
                          users: [],
                          subjects: [],
                          posts: [],
                        });
                      }}
                      className="text-xs text-accent-1 hover:text-accent-2 font-black uppercase tracking-widest px-3 py-1 bg-accent-1/10 rounded-lg"
                    >
                      Limpar
                    </button>
                  </div>

                  {/* 1. SEÇÃO DE TEMAS (SUBJECTS) */}
                  {searchResults.subjects.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3 text-accent-1">
                        <Layers size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                          Disciplinas e Temas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.subjects.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setFilter(sub);
                              const area = knowledgeAreas.find((a) =>
                                a.subjects.includes(sub),
                              );
                              if (area) setActiveArea(area.name);
                              setSearchTerm("");
                              setSearchResults({
                                users: [],
                                subjects: [],
                                posts: [],
                              });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all hover:scale-105 active:scale-95 ${getTagClass(sub)}`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. SEÇÃO DE COLEGAS (USERS) */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400">
                      <UserIcon size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                        Estudantes ({searchResults.users.length})
                      </span>
                    </div>
                    {searchResults.users.length === 0 &&
                    searchResults.subjects.length === 0 &&
                    searchResults.posts.length === 0 ? (
                      <div className="text-sm text-zinc-500 py-4 text-center font-bold">
                        Sem resultados no momento...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {searchResults.users.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent("open-profile", {
                                  detail: { uid: user.id },
                                }),
                              );
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-bg-main/50 cursor-pointer transition-all border border-transparent hover:border-glass-border"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  user.photoURL ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "Estudante")}&background=random`
                                }
                                alt={user.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-glass-border"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-text-primary leading-tight">
                                  {user.displayName}
                                </span>
                                <span className="text-xs text-accent-1 font-black">
                                  @{user.handle || "estudante"}
                                </span>
                              </div>
                            </div>
                            {user.isVerified && (
                              <CheckCircle
                                size={12}
                                className="text-accent-1"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. SEÇÃO DE POSTS (CONTEÚDO) */}
                  {searchResults.posts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-zinc-400 border-t border-white/5 pt-4">
                        <FileText size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                          Notas e Publicações Relacionadas
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {searchResults.posts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => {
                              // Rolar até o post ou apenas fechar e deixar o filtro do feed agir
                              setSearchTerm(searchTerm); // Mantém o termo para o filtro do feed
                              setSearchResults({
                                users: [],
                                subjects: [],
                                posts: [],
                              });
                              const element = document.getElementById(
                                `post-${post.id}`,
                              );
                              if (element) {
                                element.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                element.classList.add(
                                  "ring-2",
                                  "ring-accent-1",
                                  "duration-1000",
                                );
                                setTimeout(
                                  () =>
                                    element.classList.remove(
                                      "ring-2",
                                      "ring-accent-1",
                                    ),
                                  3000,
                                );
                              }
                            }}
                            className="p-3 rounded-xl bg-bg-main/50 border border-glass-border hover:border-accent-1/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-accent-1/20 text-accent-1 font-black uppercase">
                                {post.subject || "Geral"}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-bold">
                                por {post.authorName}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {post.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-glass-border text-center">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                      Role para baixo no feed para ver todos os resultados
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button className="h-14 w-14 flex items-center justify-center bg-accent-1/10 border-2 border-accent-1/20 rounded-2xl text-accent-1 hover:bg-accent-1 hover:text-[color:var(--btn-text-color,white)] transition-all shadow-xl shadow-accent-1/10">
              <Bot size={24} />
            </button>
          </section>

          {/* Crow's Tip - Thematic Detail */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group mb-10 overflow-hidden rounded-[2rem] bg-bg-secondary border border-slate-200 dark:border-zinc-800 p-8 shadow-2xl shadow-black/10"
          >
            <div className="p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-500 text-black dark:text-white">
              <Zap size={150} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 bg-accent-1 rounded-xl flex items-center justify-center shadow-lg shadow-accent-1/30"
                    style={{ color: "var(--btn-text-color, white)" }}
                  >
                    <Zap size={20} />
                  </div>
                  <span className="text-lg font-black tracking-tight text-black dark:text-white font-black">
                    Dica do Corvo
                  </span>
                </div>
                <div className="bg-accent-1/10 dark:bg-white/5 border-2 border-accent-1/20 dark:border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-accent-1 uppercase tracking-wider">
                  🎓 Foco na Aprovação
                </div>
              </div>

              <p
                className="text-xl font-black leading-relaxed italic text-black dark:text-zinc-200"
                style={{ opacity: 1 }}
              >
                "{getPhraseOfTheDay()}"
              </p>
            </div>
          </motion.div>

          <section
            className="bg-bg-secondary border border-slate-200 dark:border-zinc-800/80 shadow-lg shadow-black/5 rounded-[1.5rem] p-4 md:p-6 mb-8 relative"
          >
            {/* Scroll to Publish Button */}
            <button
              onClick={scrollToPublish}
              style={{
                position: "absolute",
                right: "15px",
                top: "15px",
                background: "var(--accent-1-10)",
                border: "2px solid var(--accent-1)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-1)",
                cursor: "pointer",
                zIndex: 10,
                opacity: 0.6,
                transition: "0.3s",
              }}
              className="scroll-publish-btn flex md:hidden hover:scale-105 active:scale-95"
              title="Rolar para o botão publicar"
            >
              <ChevronDown size={16} />
            </button>

            <div className="flex gap-4 items-start w-full">
              {/* Left Column: Logged-in User Avatar */}
              <div className="shrink-0">
                <UserAvatar
                  uid={currentUser?.uid || ""}
                  fallbackPhoto={userProfile?.photoURL || currentUser?.photoURL || ""}
                  fallbackName={userProfile?.displayName || currentUser?.displayName || "Estudante"}
                  size="48px"
                  className="border-2 border-accent-1/40 p-[2px] bg-bg-main rounded-full"
                />
              </div>

              {/* Right Column: Title, Composer Area, and Toolbar */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Compartilhe seu progresso
                    </h3>
                    <p className="text-xs text-zinc-500 font-bold hidden sm:block">
                      Inspire os colegas com seus estudos!
                    </p>
                  </div>
                  
                  {/* Slimmed inline selector buttons */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900/60 p-1 rounded-xl self-start sm:self-auto border border-slate-250/20 dark:border-white/5">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        postType === "text"
                          ? "bg-accent-1 text-slate-900 dark:text-zinc-950 shadow-md"
                          : "text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40"
                      }`}
                      onClick={() => {
                        setPostType("text");
                        setTimeout(() => postTextareaRef.current?.focus(), 50);
                      }}
                      title="Texto"
                    >
                      <FileText size={14} /> <span>Texto</span>
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        postType === "image"
                          ? "bg-accent-1 text-slate-900 dark:text-zinc-950 shadow-md"
                          : "text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40"
                      }`}
                      onClick={() => {
                        setPostType("image");
                        setTimeout(() => postTextareaRef.current?.focus(), 50);
                        imageInputRef.current?.click();
                      }}
                      title="Foto"
                    >
                      <ImageIcon size={14} /> <span>Foto</span>
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        postType === "video"
                          ? "bg-accent-1 text-slate-900 dark:text-zinc-950 shadow-md"
                          : "text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40"
                      }`}
                      onClick={() => {
                        setPostType("video");
                        setTimeout(() => postTextareaRef.current?.focus(), 50);
                        videoInputRef.current?.click();
                      }}
                      title="Vídeo"
                    >
                      <Video size={14} /> <span>Mídia</span>
                    </button>
                  </div>
                </div>

                <div className="post-body">
                  <textarea
                    ref={postTextareaRef}
                    placeholder={
                      postType === "text"
                        ? "O que você está estudando hoje?"
                        : postType === "image"
                          ? "Legenda para sua foto de estudos..."
                          : "Descrição para seu vídeo..."
                    }
                    className="w-full bg-transparent border-0 outline-none text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-base md:text-lg font-semibold resize-none min-h-[90px] mb-2 focus:ring-0 focus:outline-none p-0"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  />
              {postType === "image" && (
                <div
                  className="post-image-input"
                  style={{ marginBottom: "12px" }}
                >
                  {newPostImages.length > 0 ||
                  newPostImage.startsWith("data:") ||
                  newPostImage.startsWith("blob:") ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {newPostImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-2xl overflow-hidden border-2 border-white/10 group bg-black/20 aspect-video flex items-center justify-center p-1"
                          >
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="max-h-full max-w-full object-contain rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPostImages((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  setSelectedImageFiles((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                                title="Remover Imagem"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {newPostImage &&
                          !newPostImages.includes(newPostImage) &&
                          (newPostImage.startsWith("data:") ||
                            newPostImage.startsWith("blob:")) && (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 group bg-black/20 aspect-video flex items-center justify-center p-1">
                              <img
                                src={newPostImage}
                                alt="Preview Single"
                                className="max-h-full max-w-full object-contain rounded-xl"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewPostImage("");
                                    setSelectedImageFile(null);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                                  title="Remover Imagem"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="rounded-2xl border-2 border-dashed border-accent-1/30 hover:border-accent-1 bg-accent-1/5 hover:bg-accent-1/10 flex flex-col items-center justify-center group gap-1 cursor-pointer transition-all aspect-video"
                        >
                          <Plus
                            className="text-accent-1 group-hover:scale-110 transition-transform"
                            size={24}
                          />
                          <span className="text-[10px] font-black text-accent-1 uppercase tracking-wider">
                            Mais Fotos
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-black uppercase shrink-0">
                          Ou cole a URL:
                        </span>
                        <input
                          type="text"
                          placeholder="https://exemplo.com/foto.jpg"
                          className="w-full bg-slate-900/40 dark:bg-black/40 border-2 border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          value={
                            newPostImage &&
                            (newPostImage.startsWith("data:") ||
                              newPostImage.startsWith("blob:"))
                              ? ""
                              : newPostImage
                          }
                          onChange={(e) => setNewPostImage(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleImageDrop}
                        className="border-2 border-dashed border-accent-1/30 hover:border-accent-1 bg-accent-1/5 hover:bg-accent-1/10 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group text-center"
                        title="Clique para abrir o armazenamento do celular/computador ou solte as imagens aqui!"
                      >
                        <div className="w-12 h-12 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-black text-black dark:text-white mb-1 leading-snug">
                          Clique Aqui para Escolher do Seu Celular/PC
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                          (Ou arraste e solte múltiplos arquivos aqui)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-black uppercase shrink-0">
                          Ou cole a URL:
                        </span>
                        <input
                          type="text"
                          placeholder="https://exemplo.com/foto.jpg"
                          className="w-full bg-slate-900/40 dark:bg-black/40 border-2 border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          value={newPostImage}
                          onChange={(e) => setNewPostImage(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {postType === "video" && (
                <div
                  className="post-video-input"
                  style={{ marginBottom: "12px" }}
                >
                  {newPostVideos.length > 0 ||
                  newPostVideo.startsWith("data:") ||
                  newPostVideo.startsWith("blob:") ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {newPostVideos.map((vid, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-2xl overflow-hidden border-2 border-white/10 group bg-black/20 flex flex-col items-center justify-center p-4 min-h-[160px]"
                          >
                            {vid.startsWith("data:audio/") ||
                            vid.includes("audio") ||
                            vid.startsWith("data:application/octet-stream") ||
                            (selectedMediaFiles[idx] &&
                              (selectedMediaFiles[idx].type.startsWith(
                                "audio/",
                              ) ||
                                selectedMediaFiles[idx].name.endsWith(".mp3") ||
                                selectedMediaFiles[idx].name.endsWith(".wav") ||
                                selectedMediaFiles[idx].name.endsWith(
                                  ".ogg",
                                ))) ? (
                              <div className="flex flex-col items-center justify-center text-center w-full">
                                <div className="w-10 h-10 bg-accent-1/20 text-accent-1 rounded-xl flex items-center justify-center mb-2">
                                  <Music size={20} />
                                </div>
                                <span className="text-xs font-black mb-2 text-white truncate max-w-full">
                                  {selectedMediaFiles[idx]?.name ||
                                    `Áudio #${idx + 1}`}
                                </span>
                                <audio
                                  src={vid}
                                  controls
                                  className="w-full max-w-xs scale-90"
                                />
                              </div>
                            ) : (
                              <video
                                src={vid}
                                controls
                                className="max-h-32 rounded-lg w-auto"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPostVideos((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  setSelectedMediaFiles((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                                title="Remover Mídia"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {newPostVideo &&
                          !newPostVideos.includes(newPostVideo) &&
                          (newPostVideo.startsWith("data:") ||
                            newPostVideo.startsWith("blob:")) && (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 group bg-black/20 flex flex-col items-center justify-center p-4 min-h-[160px]">
                              {newPostVideo.startsWith("data:audio/") ||
                              newPostVideo.includes("audio") ||
                              newPostVideo.startsWith(
                                "data:application/octet-stream",
                              ) ? (
                                <div className="flex flex-col items-center justify-center text-center w-full">
                                  <div className="w-10 h-10 bg-accent-1/20 text-accent-1 rounded-xl flex items-center justify-center mb-2">
                                    <Music size={20} />
                                  </div>
                                  <span className="text-xs font-black mb-2 text-white truncate max-w-full">
                                    {selectedFileName ||
                                      "Áudio Externo / Local"}
                                  </span>
                                  <audio
                                    src={newPostVideo}
                                    controls
                                    className="w-full max-w-xs scale-90"
                                  />
                                </div>
                              ) : (
                                <video
                                  src={newPostVideo}
                                  controls
                                  className="max-h-32 rounded-lg w-auto"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewPostVideo("");
                                    setSelectedMediaFile(null);
                                    setSelectedFileName("");
                                    setSelectedFileSize(0);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                                  title="Remover Mídia"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="rounded-2xl border-2 border-dashed border-accent-1/30 hover:border-accent-1 bg-accent-1/5 hover:bg-accent-1/10 flex flex-col items-center justify-center group gap-1 cursor-pointer transition-all aspect-video min-h-[160px]"
                        >
                          <Plus
                            className="text-accent-1 group-hover:scale-110 transition-transform"
                            size={24}
                          />
                          <span className="text-[10px] font-black text-accent-1 uppercase tracking-wider font-bold">
                            Mais Vídeo/Áudio
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-black uppercase shrink-0">
                          Ou cole link (YouTube):
                        </span>
                        <input
                          type="text"
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full bg-slate-900/40 dark:bg-black/40 border-2 border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          value={
                            newPostVideo &&
                            (newPostVideo.startsWith("data:") ||
                              newPostVideo.startsWith("blob:"))
                              ? ""
                              : newPostVideo
                          }
                          onChange={(e) => setNewPostVideo(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div
                        onClick={() => videoInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleVideoDrop}
                        className="border-2 border-dashed border-accent-1/30 hover:border-accent-1 bg-accent-1/5 hover:bg-accent-1/10 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group text-center"
                        title="Clique para abrir o armazenamento do celular/computador ou solte a vídeoaula/áudio aqui!"
                      >
                        <div className="w-14 h-14 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Video size={28} />
                        </div>
                        <p className="text-sm font-black text-black dark:text-white mb-1 leading-snug">
                          Clique Aqui e Escolha suas Videoaulas ou Áudios
                        </p>
                        <p className="text-xs text-zinc-500 font-bold mb-3 uppercase tracking-wider">
                          (O Corvo aceita até 1.2GB!)
                        </p>
                        <span className="inline-block bg-accent-1/20 text-accent-1 text-[9px] font-black uppercase tracking-[1.5px] px-3.5 py-1.5 rounded-xl group-hover:bg-accent-1 group-hover:text-black transition-colors">
                          ABRIR O ARMAZENAMENTO JÁ
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-black uppercase shrink-0">
                          Ou cole link (YouTube):
                        </span>
                        <input
                          type="text"
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full bg-slate-900/40 dark:bg-black/40 border-2 border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          value={newPostVideo}
                          onChange={(e) => setNewPostVideo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={imageInputRef}
                style={{ display: "none" }}
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
              />
              <input
                type="file"
                ref={videoInputRef}
                style={{ display: "none" }}
                accept="video/*,audio/*"
                multiple
                onChange={handleVideoFileChange}
              />
            </div>

            <div
              className="post-actions"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--glass-border)",
                paddingTop: "15px",
                display: "flex",
                position: "relative",
              }}
            >
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}
              >
                <button
                  onClick={() => setIsSubjectPickerOpen(!isSubjectPickerOpen)}
                  className="subject-picker-btn"
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    border: "2px solid var(--glass-border)",
                    borderRadius: "14px",
                    padding: "10px 20px",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  <BookOpen size={20} />
                  {newPostSubject || "Selecione a Matéria"}
                  <motion.div
                    animate={{ rotate: isSubjectPickerOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex" }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <button
                  onClick={() => {
                    setIsMentionPickerOpen(!isMentionPickerOpen);
                    setIsSubjectPickerOpen(false);
                  }}
                  type="button"
                  className="subject-picker-btn"
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    border: "2px solid var(--glass-border)",
                    borderRadius: "14px",
                    padding: "10px 20px",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.2rem",
                      color: "var(--accent-1)",
                      fontWeight: 950,
                    }}
                  >
                    @
                  </span>
                  <span>Marcar Colega</span>
                </button>

                <AnimatePresence>
                  {isMentionPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "120px",
                        marginBottom: "15px",
                        width: "320px",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "20px",
                        padding: "20px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        zIndex: 103,
                        backdropFilter: "blur(20px)",
                      }}
                      className="text-left"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "15px",
                        }}
                      >
                        <h4
                          className="text-black dark:text-white"
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 900,
                            margin: 0,
                          }}
                        >
                          Marcar Alguém
                        </h4>
                        <button
                          onClick={() => setIsMentionPickerOpen(false)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nome ou @handle..."
                        value={mentionSearchTerm}
                        onChange={(e) => setMentionSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/40 dark:bg-black/40 border-2 border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none mb-3"
                      />
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {matchingUsers.length === 0 ? (
                           <div className="text-xs text-zinc-500 py-2 text-center font-bold uppercase">
                             Nenhum colega encontrado
                           </div>
                         ) : (
                           matchingUsers.map((u) => (
                             <div
                               key={u.id}
                               onClick={() => {
                                 const handle =
                                   u.handle ||
                                   u.displayName
                                     ?.toLowerCase()
                                     .replace(/\s+/g, "") ||
                                   "estudante";
                                 setNewPostText((prev) => prev + ` @${handle} `);
                                 setIsMentionPickerOpen(false);
                                 setMentionSearchTerm("");
                               }}
                               className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent-1/10 cursor-pointer transition-all border border-transparent hover:border-accent-1/20"
                             >
                               <img
                                 src={
                                   u.photoURL ||
                                   `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "Estudante")}&background=random`
                                 }
                                 alt={u.displayName}
                                 className="w-8 h-8 rounded-full object-cover border border-white/10"
                                 referrerPolicy="no-referrer"
                               />
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-black dark:text-white leading-tight">
                                   {u.displayName}
                                 </span>
                                 <span className="text-[10px] text-accent-1 font-black">
                                   @{u.handle || "estudante"}
                                 </span>
                               </div>
                             </div>
                           ))
                         )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isSubjectPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        marginBottom: "15px",
                        width: "320px",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "20px",
                        padding: "20px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        zIndex: 100,
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "15px",
                        }}
                      >
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                          Escolha a Matéria
                        </h4>
                        <button
                          onClick={() => setIsSubjectPickerOpen(false)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div
                        ref={subjectListRef}
                        className="subject-picker-list custom-scrollbar"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "15px",
                          maxHeight: "350px",
                          overflowY: "auto",
                          paddingRight: "12px",
                          scrollBehavior: "smooth",
                        }}
                      >
                        {knowledgeAreas.map((area) => (
                          <div key={area.id}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                color: "var(--text-primary)",
                                marginBottom: "8px",
                                display: "block",
                              }}
                            >
                              {area.name}
                            </span>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                              }}
                            >
                              {area.subjects.map((sub) => (
                                <button
                                  key={sub}
                                  onClick={() => {
                                    setNewPostSubject(sub);
                                    setIsSubjectPickerOpen(false);
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid",
                                    borderColor:
                                      newPostSubject === sub
                                        ? "var(--accent-1)"
                                        : "var(--glass-border)",
                                    background:
                                      newPostSubject === sub
                                        ? "rgba(91, 153, 142, 0.1)"
                                        : "rgba(255,255,255,0.03)",
                                    color: "var(--text-primary)",
                                    fontSize: "0.8rem",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "0.2s",
                                  }}
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                ref={publishButtonRef}
                className="chip active"
                style={{
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "999px",
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
                  opacity: isPublishing ? 0.7 : 1,
                  cursor: isPublishing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Bot size={16} className="animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Postar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

          {activeTrendView && (
            <div
              className="trend-view-header glass-card"
              style={{
                padding: "25px",
                marginBottom: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                <button
                  onClick={() => {
                    setActiveTrendView(null);
                    setFilter("Todos");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "15px",
                    background: "var(--accent-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  #
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {activeTrendView.name}
                  </h2>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {activeTrendView.category === "Redação"
                      ? "Guia de Repertórios e Conteúdo"
                      : `Explorando ${activeTrendView.category}`}
                  </span>
                </div>
              </div>

              <nav
                className="trend-tabs"
                style={{
                  display: "flex",
                  gap: "30px",
                  borderBottom: "1px solid var(--glass-border)",
                  marginTop: "20px",
                }}
              >
                <button
                  className={`trend-tab ${trendTab === "tudo" ? "active" : ""}`}
                  onClick={() => setTrendTab("tudo")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "10px 0",
                    color:
                      trendTab === "tudo"
                        ? "var(--accent-1)"
                        : "var(--text-secondary)",
                    borderBottom:
                      trendTab === "tudo"
                        ? "2px solid var(--accent-1)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Tudo
                </button>
                <button
                  className={`trend-tab ${trendTab === "posts" ? "active" : ""}`}
                  onClick={() => setTrendTab("posts")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "10px 0",
                    color:
                      trendTab === "posts"
                        ? "var(--accent-1)"
                        : "var(--text-secondary)",
                    borderBottom:
                      trendTab === "posts"
                        ? "2px solid var(--accent-1)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Posts
                </button>
                <button
                  className={`trend-tab ${trendTab === "videos" ? "active" : ""}`}
                  onClick={() => setTrendTab("videos")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "10px 0",
                    color:
                      trendTab === "videos"
                        ? "var(--accent-1)"
                        : "var(--text-secondary)",
                    borderBottom:
                      trendTab === "videos"
                        ? "2px solid var(--accent-1)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Vídeos
                </button>
                <button
                  className={`trend-tab ${trendTab === "fotos" ? "active" : ""}`}
                  onClick={() => setTrendTab("fotos")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "10px 0",
                    color:
                      trendTab === "fotos"
                        ? "var(--accent-1)"
                        : "var(--text-secondary)",
                    borderBottom:
                      trendTab === "fotos"
                        ? "2px solid var(--accent-1)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Fotos
                </button>
                {activeTrendView.category === "Redação" && (
                  <button
                    className={`trend-tab ${trendTab === "repertórios" ? "active" : ""}`}
                    onClick={() => setTrendTab("repertórios")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 0",
                      color:
                        trendTab === "repertórios"
                          ? "var(--accent-1)"
                          : "var(--text-secondary)",
                      borderBottom:
                        trendTab === "repertórios"
                          ? "2px solid var(--accent-1)"
                          : "2px solid transparent",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Repertórios
                  </button>
                )}
              </nav>
            </div>
          )}

          {trendTab === "repertórios" && activeTrendView ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="editorial-repertoire"
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "0 0 80px 0",
              }}
            >
              {/* Background Massive Text - More subtle and integrated */}
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  right: "-5%",
                  fontSize: "25vw",
                  fontFamily: "Anton",
                  color: "rgba(255,255,255,0.02)",
                  lineHeight: 0.7,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                  zIndex: 0,
                }}
              >
                {activeTrendView.name}
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "80px",
                    borderBottom: "1px solid var(--glass-border)",
                    paddingBottom: "20px",
                  }}
                >
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <h2
                      style={{
                        fontFamily: "Anton",
                        fontSize: "clamp(2rem, 6vw, 4rem)",
                        lineHeight: 0.8,
                        letterSpacing: "-0.03em",
                        textTransform: "uppercase",
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      {activeTrendView.name}
                    </h2>
                  </motion.div>
                  <div style={{ textAlign: "right", paddingBottom: "10px" }}>
                    <span
                      style={{
                        fontFamily: "var(--f-sans)",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: "var(--accent-1)",
                        display: "block",
                      }}
                    >
                      Curadoria do Ninho
                    </span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Edição Vol. 01 • 2024
                    </span>
                  </div>
                </div>

                {(
                  recommendations[activeTrendView.name] ||
                  recommendations["Redação"]
                ).map((themeGroup, themeIdx) => (
                  <div key={themeIdx} style={{ marginBottom: "120px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "40px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        paddingBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Anton",
                          fontSize: "3.5rem",
                          color: "var(--accent-1)",
                          opacity: 0.2,
                          lineHeight: 1,
                        }}
                      >
                        0{themeIdx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.4em",
                            color: "var(--accent-1)",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          Eixo Temático Selecionado
                        </span>
                        <h3
                          style={{
                            fontFamily: "Anton",
                            fontSize: "2.4rem",
                            textTransform: "uppercase",
                            margin: 0,
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                            lineHeight: 1,
                          }}
                        >
                          {themeGroup.theme}
                        </h3>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(380px, 1fr))",
                        gap: "40px",
                      }}
                    >
                      {themeGroup.items.map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: 40, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{
                            delay: i * 0.1,
                            duration: 0.8,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          style={{
                            background: "rgba(255,255,255,0.01)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "32px",
                            border: "1px solid rgba(255,255,255,0.06)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              height: "260px",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={rec.image}
                              alt={rec.title}
                              referrerPolicy="no-referrer"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: "24px",
                                left: "24px",
                                background: "black",
                                color: "white",
                                padding: "6px 16px",
                                fontSize: "0.65rem",
                                fontWeight: 950,
                                textTransform: "uppercase",
                                borderRadius: "8px",
                                letterSpacing: "0.15em",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                              }}
                            >
                              {rec.type}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "32px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "12px",
                              }}
                            >
                              <h4
                                style={{
                                  fontFamily: "Anton",
                                  fontSize: "2rem",
                                  textTransform: "uppercase",
                                  lineHeight: 0.9,
                                  margin: 0,
                                }}
                              >
                                {rec.title}
                              </h4>
                              <div
                                style={{
                                  color: "var(--accent-1)",
                                  background: "var(--accent-1-10)",
                                  padding: "8px",
                                  borderRadius: "12px",
                                }}
                              >
                                {rec.type === "Filme" && <Film size={20} />}
                                {rec.type === "Série" && <Tv size={20} />}
                                {rec.type === "Livro" && <Book size={20} />}
                                {rec.type === "Música" && <Music size={20} />}
                                {rec.type === "Conceito" && <Brain size={20} />}
                                {rec.type === "Documentário" && (
                                  <Video size={20} />
                                )}
                                {rec.type === "Tema" && <PenTool size={20} />}
                              </div>
                            </div>

                            <p
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 900,
                                color: "var(--accent-1)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "24px",
                                paddingLeft: "5px",
                                borderLeft: "2px solid var(--accent-1)",
                              }}
                            >
                              {rec.desc}
                            </p>

                            <div
                              style={{
                                marginBottom: "32px",
                                padding: "20px",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "20px",
                                border: "1px solid rgba(255,255,255,0.03)",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.95rem",
                                  lineHeight: 1.6,
                                  opacity: 0.7,
                                  margin: 0,
                                  fontWeight: 500,
                                }}
                              >
                                {rec.synopsis}
                              </p>
                            </div>

                            {/* Crow's Tip - Distinctive UI */}
                            <div
                              style={{
                                background:
                                  "linear-gradient(to right, rgba(91, 153, 142, 0.05), transparent)",
                                padding: "24px",
                                borderRadius: "16px",
                                marginBottom: "32px",
                                borderLeft: "4px solid var(--accent-1)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "8px",
                                }}
                              >
                                <Bot size={14} className="text-accent-1" />
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 950,
                                    textTransform: "uppercase",
                                    color: "var(--accent-1)",
                                    letterSpacing: "0.2em",
                                  }}
                                >
                                  Dica Estratégica
                                </span>
                              </div>
                              <p
                                style={{
                                  fontSize: "1rem",
                                  fontWeight: 600,
                                  lineHeight: 1.5,
                                  color: "#fff",
                                  fontStyle: "italic",
                                }}
                              >
                                "{rec.crowTip}"
                              </p>
                            </div>

                            {/* Essay Integration */}
                            <div
                              style={{
                                background: "#ffffff",
                                color: "#000000",
                                padding: "28px",
                                borderRadius: "24px",
                                marginBottom: "32px",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 950,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.2em",
                                  display: "block",
                                  marginBottom: "16px",
                                  opacity: 0.5,
                                }}
                              >
                                Aplicação na Redação
                              </span>
                              <div className="space-y-4">
                                <div className="flex gap-4">
                                  <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center font-black text-[10px] shrink-0">
                                    I
                                  </div>
                                  <p className="text-[12px] font-bold leading-relaxed">
                                    {rec.usage.intro}
                                  </p>
                                </div>
                                <div className="flex gap-4 border-t border-black/5 pt-4">
                                  <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center font-black text-[10px] shrink-0">
                                    II
                                  </div>
                                  <p className="text-[12px] font-bold leading-relaxed">
                                    {rec.usage.dev}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                marginTop: "auto",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingTop: "20px",
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.6rem",
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    opacity: 0.4,
                                    letterSpacing: "0.1em",
                                  }}
                                >
                                  Onde encontrar
                                </span>
                                <span className="text-sm font-bold text-white/80">
                                  {rec.whereToWatch}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setExploringItem({ ...rec, type: rec.type })
                                }
                                className="group bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]"
                              >
                                Abrir{" "}
                                <ChevronRight
                                  size={14}
                                  className="group-hover:translate-x-1 transition-transform"
                                />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Dynamic Community Highlight */}
              {communityHighlight && trendTab === "tudo" && (
                <div
                  className="glass-card detailed-border"
                  style={{
                    padding: "32px",
                    borderRadius: "32px",
                    marginBottom: "40px",
                    background:
                      "linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05))",
                    border: "2px solid var(--accent-1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <Award size={28} style={{ color: "var(--accent-1)" }} />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.4rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Destaque da Comunidade
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "30px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "24px",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "4px solid white",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                    >
                      {communityHighlight.mediaURL ||
                      communityHighlight.imageURL ? (
                        <img
                          src={
                            communityHighlight.mediaURL ||
                            communityHighlight.imageURL
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--bg-main)",
                            color: "var(--accent-1)",
                          }}
                        >
                          <FileText size={56} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "1.1rem",
                          fontWeight: 950,
                          color: "var(--text-primary)",
                        }}
                      >
                        {communityHighlight.authorName} está dominando{" "}
                        {activeTrendView?.name}!
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        "{communityHighlight.content}"
                      </p>
                      <div
                        style={{
                          marginTop: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--accent-1)",
                            fontWeight: 950,
                            background: "var(--bg-secondary)",
                            padding: "5px 15px",
                            borderRadius: "10px",
                          }}
                        >
                          {communityHighlight.likesCount} curtidas
                        </span>
                        <button
                          onClick={() => openPostModal(communityHighlight)}
                          style={{
                            background: "var(--accent-1)",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "12px",
                            border: "none",
                            fontSize: "0.9rem",
                            fontWeight: 900,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          className="hover:scale-105"
                        >
                          Ver Movimento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {posts
                .filter((post) => {
                  // Apply active filter (knowledge area subject)
                  if (filter !== "Todos" && post.subject !== filter) {
                      return false;
                  }

                  // Apply tab filter
                  if (trendTab === "posts" && post.type !== "text" && post.type !== "quote" && post.type !== "repost")
                    return false;
                  if (trendTab === "videos" && post.type !== "video")
                    return false;
                  if (trendTab === "fotos" && post.type !== "image")
                    return false;

                  // Apply search term filter on posts if any
                  if (searchTerm.trim().length > 0) {
                    const term = searchTerm.trim().toLowerCase();
                    const cleanTerm = term.startsWith("@")
                      ? term.substring(1)
                      : term;

                    const authorName = (post.authorName || "").toLowerCase();
                    const authorHandle = (
                      post.authorHandle || ""
                    ).toLowerCase();
                    const content = (post.content || "").toLowerCase();
                    const subject = (post.subject || "").toLowerCase();

                    return (
                      authorName.includes(cleanTerm) ||
                      authorHandle.includes(cleanTerm) ||
                      content.includes(cleanTerm) ||
                      subject.includes(cleanTerm)
                    );
                  }
                  return true;
                })
                .map((post, index) => {
                  const currentViewMode =
                    postViewMode[post.id] ||
                    (post.type === "video" && post.videoURL
                      ? "video"
                      : post.type === "image" && post.imageURL
                        ? "image"
                        : "text");
                  const originalPostForRepost = post.repostOfId
                    ? (posts.find((p) => p.id === post.repostOfId) || (post as any).originalPost)
                    : null;
                  const originalPostForQuote = post.quoteOfId
                    ? (posts.find((p) => p.id === post.quoteOfId) || (post as any).originalPost)
                    : null;

                  return (
                    <motion.article
                      key={post.id}
                      id={`post-${post.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="post-card transition-all duration-200 group/post text-left focus:outline-none mb-6"
                    >
                      {/* Header Column: Author Avatar & Name */}
                      <div className="flex items-center gap-3 md:gap-4 w-full mb-4">
                        <div className="shrink-0">
                          <UserDisplay
                            uid={post.authorId}
                            fallbackName={post.authorName}
                            fallbackPhoto={post.authorPhoto}
                            fallbackHandle={post.authorHandle}
                            onlyAvatar={true}
                            size="44px"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex items-start justify-between">
                          <div className="flex flex-col justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(
                                  new CustomEvent("open-profile", {
                                    detail: { uid: post.authorId },
                                  }),
                                );
                              }}
                              className="font-extrabold hover:underline text-[#0f1419] dark:text-[#f7f9f9] text-[15px] sm:text-[16px] leading-tight text-left flex items-center gap-1.5"
                            >
                              {post.authorName}
                              {/* Verification badges */}
                              {(() => {
                                const h = (post.authorHandle || "").toLowerCase().trim();
                                if (h === "_giu.conti") {
                                  return (
                                    <span title="Verificado" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-amber-500 fill-amber-500/10"
                                      />
                                    </span>
                                  );
                                }
                                if (h === "victordossantos2103") {
                                  return (
                                    <span title="Verificado" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-sky-500 fill-sky-500/10"
                                      />
                                    </span>
                                  );
                                }
                                if (h === "giulia") {
                                  return (
                                    <span title="Verificado" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-emerald-500 fill-emerald-500/10"
                                      />
                                    </span>
                                  );
                                }
                                if (h === "dnuneskkj") {
                                  return (
                                    <span title="Verificado" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-pink-500 fill-pink-500/10"
                                      />
                                    </span>
                                  );
                                }
                                if (post.authorId === "vestapp_official_mascot") {
                                  return (
                                    <span title="Mascote Oficial" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-accent-1"
                                      />
                                    </span>
                                  );
                                }
                                if (post.authorId === "ai_curator_bot") {
                                  return (
                                    <span title="AI Curador" className="inline-flex">
                                      <CheckCircle
                                        size={14}
                                        className="shrink-0 text-indigo-500"
                                      />
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </button>

                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">
                              <span>
                                @{post.authorHandle || "estudante"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500 font-bold tracking-widest uppercase">
                              <span>
                                {formatDate(post.createdAt)}
                              </span>
                              
                              {post.subject && (
                                <>
                                  <span>·</span>
                                  <span className={getTagClass(post.subject)}>
                                    {post.subject}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {post.authorId === currentUser?.uid && (
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMenu(
                                    activeMenu === post.id ? null : post.id,
                                  );
                                }}
                                className="p-1.5 rounded-full text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-[#0f1419] dark:hover:text-zinc-100 transition-all cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </button>
                              <AnimatePresence>
                                {activeMenu === post.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPostToDelete(post.id);
                                        setActiveMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                                    >
                                      <Trash2 size={12} /> Excluir Post
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post body, attachments, quotes */}
                      <div className="space-y-4 w-full">
                          {post.repostOfId && originalPostForRepost && (
                            <div className="flex items-center gap-1.5 mb-2 py-0.5 px-2 rounded bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 w-fit">
                              <Repeat size={12} className="text-emerald-500" />
                              <span className="text-[9px] font-extrabold uppercase tracking-widest leading-none">
                                Republicado por{" "}
                                {post.authorName === userProfile?.displayName
                                  ? "você"
                                  : post.authorName}
                              </span>
                            </div>
                          )}

                          <div
                            onClick={() => openPostModal(post)}
                            className="cursor-pointer group/content space-y-3"
                          >
                            {post.content && (
                              <p
                                className={`text-[#0f1419] dark:text-white leading-relaxed whitespace-pre-wrap break-words ${
                                  !post.imageURL && !post.videoURL && !post.quoteOfId
                                    ? (post.type === "text" || post.type === "quote")
                                      ? "text-xl md:text-2xl font-extrabold tracking-tight"
                                      : "text-base font-medium"
                                    : "text-base font-normal"
                                }`}
                              >
                                {renderContentWithMentions(post.content)}
                              </p>
                            )}

                            {/* Quoted Post Box */}
                            {post.quoteOfId && originalPostForQuote && (
                              <div className="mt-3 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-500/[0.01] hover:bg-slate-500/[0.03] transition-all group/quoted text-left">
                                <div className="flex items-center gap-1.5 mb-2 flex-wrap text-xs">
                                  <img
                                    src={originalPostForQuote.authorPhoto}
                                    className="w-5 h-5 rounded-full"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="font-extrabold text-slate-900 dark:text-white">
                                    {originalPostForQuote.authorName}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 font-bold">
                                    @{originalPostForQuote.authorHandle}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 ml-auto">
                                    {formatDate(originalPostForQuote.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-2 break-all">
                                  {originalPostForQuote.content}
                                </p>
                                {originalPostForQuote.imageURL && (
                                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800/50 max-h-40">
                                    <img
                                      src={originalPostForQuote.imageURL}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Repost content */}
                            {post.repostOfId && originalPostForRepost && (
                              <div className="space-y-3">
                                {originalPostForRepost.content && (
                                  <p className="text-slate-800 dark:text-zinc-200 leading-normal whitespace-pre-wrap text-sm md:text-base font-normal">
                                    {renderContentWithMentions(
                                      originalPostForRepost.content,
                                    )}
                                  </p>
                                )}
                                {originalPostForRepost.imageURLs && originalPostForRepost.imageURLs.length > 0 ? (
                                  <div className={`grid gap-2 rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 shadow-md ${
                                    originalPostForRepost.imageURLs.length === 1 ? 'grid-cols-1' :
                                    originalPostForRepost.imageURLs.length === 2 ? 'grid-cols-2' :
                                    originalPostForRepost.imageURLs.length === 3 ? 'grid-cols-3' :
                                    'grid-cols-2'
                                  }`}>
                                    {originalPostForRepost.imageURLs.map((url: string, idx: number) => (
                                      <div key={idx} className="relative overflow-hidden aspect-video bg-zinc-900">
                                        <img
                                          src={url}
                                          className="w-full h-full object-cover"
                                          alt={`Repost img ${idx + 1}`}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : originalPostForRepost.imageURL ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 shadow-md">
                                    <img
                                      src={originalPostForRepost.imageURL}
                                      className="w-full h-auto max-h-[480px] object-cover"
                                      alt="Post"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : originalPostForRepost.videoURL ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 shadow-md aspect-video bg-black">
                                    <video src={originalPostForRepost.videoURL} controls className="w-full h-full object-cover" />
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {post.imageURLs && post.imageURLs.length > 0 ? (
                              <div className={`grid gap-2 rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 shadow-md ${
                                post.imageURLs.length === 1 ? 'grid-cols-1' :
                                post.imageURLs.length === 2 ? 'grid-cols-2' :
                                post.imageURLs.length === 3 ? 'grid-cols-3' :
                                'grid-cols-2'
                              }`}>
                                {post.imageURLs.map((url, idx) => (
                                  <div key={idx} className="relative overflow-hidden aspect-video bg-zinc-900">
                                    <img
                                      src={url}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                      alt={`Post img ${idx + 1}`}
                                      referrerPolicy="no-referrer"
                                      onClick={() => {
                                        setSelectedPost(post);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : post.imageURL ? (
                              <div className="rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 shadow-md transition-all">
                                <img
                                  src={post.imageURL}
                                  className="w-full h-auto max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                                  alt="Post"
                                  referrerPolicy="no-referrer"
                                  onClick={() => setSelectedPost(post)}
                                />
                              </div>
                            ) : null}

                            {post.videoURL && (
                              <div className="rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 bg-black shadow-md">
                                {post.videoURL.startsWith("local-media:") ||
                                (post.videoURL.startsWith("data:") &&
                                  !post.videoURL.startsWith("data:audio/") &&
                                  !post.videoURL.includes("audio")) ? (
                                  <LocalMediaRender
                                    videoURL={post.videoURL}
                                    postId={post.id}
                                  />
                                ) : post.videoURL.includes("youtube.com") ||
                                  post.videoURL.includes("youtu.be") ? (
                                  <div className="aspect-video">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${post.videoURL.split("v=")[1] || post.videoURL.split("/").pop()}`}
                                      className="w-full h-full"
                                      title="YouTube video player"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                ) : post.videoURL.startsWith("data:audio/") ||
                                  post.videoURL.includes("audio") ||
                                  post.videoURL.endsWith(".mp3") ||
                                  post.videoURL.endsWith(".wav") ||
                                  post.videoURL.endsWith(".ogg") ||
                                  post.videoURL.endsWith(".m4a") ||
                                  post.videoURL.startsWith(
                                    "data:application/octet-stream",
                                  ) ? (
                                  <div className="flex flex-col items-center p-4 bg-slate-900/90 dark:bg-black/95 border border-zinc-850 rounded-xl w-full text-center">
                                    <div className="w-10 h-10 bg-accent-1/20 text-accent-1 rounded-full flex items-center justify-center mb-2">
                                      <Music size={18} />
                                    </div>
                                    <p className="text-xs font-black mb-2 text-slate-200 font-sans">
                                      Arquivo de Áudio (MP3)
                                    </p>
                                    <audio
                                      src={post.videoURL}
                                      controls
                                      className="w-full max-w-sm"
                                    />
                                  </div>
                                ) : (
                                  <video
                                    src={post.videoURL}
                                    controls
                                    className="w-full h-auto max-h-[480px]"
                                  ></video>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Beautiful, tight, dynamic Twitter Action Bar */}
                          <div className="flex items-center justify-between max-w-md pt-3 mt-1 text-slate-500 dark:text-zinc-500">
                            {/* Likes Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                className={`flex items-center gap-1.5 transition-colors duration-150 group/item cursor-pointer text-xs md:text-sm ${
                                  likedPosts.has(post.id)
                                    ? "text-rose-500 font-bold"
                                    : "hover:text-rose-500 text-zinc-500"
                                }`}
                              >
                                <div className="p-1.5 rounded-full group-hover/item:bg-rose-500/10 transition-colors relative">
                                  <Heart
                                    size={16}
                                    className={likedPosts.has(post.id) ? "fill-current" : ""}
                                  />
                                  {likedPosts.has(post.id) && (
                                    <span className="absolute inset-0 bg-rose-500/20 blur-sm rounded-full scale-125"></span>
                                  )}
                                </div>
                                <span
                                  className="font-semibold hover:underline"
                                  onClick={(e) => openLikersModal(post.id, e)}
                                >
                                  {post.likesCount || 0}
                                </span>
                              </button>
                            </div>

                            {/* Comments Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleComments(post.id);
                              }}
                              className={`flex items-center gap-1.5 transition-colors duration-150 group/item cursor-pointer text-xs md:text-sm ${
                                openComments.has(post.id)
                                  ? "text-sky-500"
                                  : "hover:text-sky-500 text-zinc-500 dark:text-zinc-500"
                              }`}
                            >
                              <div className="p-1.5 rounded-full group-hover/item:bg-sky-500/10 transition-colors">
                                <MessageSquare size={16} />
                              </div>
                              <span className="font-semibold">{post.commentsCount || 0}</span>
                            </button>

                            {/* Reposts Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setRepostMenuPostId(
                                    repostMenuPostId === post.id ? null : post.id,
                                  );
                                }}
                                className={`flex items-center gap-1.5 transition-colors duration-150 group/item cursor-pointer text-xs md:text-sm ${
                                  post.repostsCount
                                    ? "text-emerald-500"
                                    : "hover:text-emerald-500 text-zinc-500 dark:text-zinc-500"
                                }`}
                                title="Republicar ou Citar"
                              >
                                <div className="p-1.5 rounded-full group-hover/item:bg-emerald-500/10 transition-colors">
                                  <Repeat size={16} />
                                </div>
                                <span className="font-semibold">{post.repostsCount || 0}</span>
                              </button>
                              <AnimatePresence>
                                {repostMenuPostId === post.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute left-0 bottom-full mb-1 w-44 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRepost(post);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-zinc-350 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                                    >
                                      <Repeat size={12} /> Republicar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setQuoteModalPost(post);
                                        setRepostMenuPostId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-zinc-350 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                                    >
                                      <PenTool size={12} /> Citar Publicação
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Share Button */}
                            <button
                              onClick={() => handleShare(post)}
                              className="p-1.5 rounded-full hover:bg-sky-500/10 hover:text-sky-500 text-zinc-500 dark:text-zinc-500 transition-colors duration-150 cursor-pointer"
                              title="Compartilhar"
                            >
                              <Share2 size={16} />
                            </button>
                          </div>

                          {/* Nested Comments section in standard thread style */}
                          {openComments.has(post.id) && (
                            <div className="mt-4 space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-3 duration-200">
                              <div className="flex gap-3 items-center">
                                <UserAvatar
                                  uid={currentUser?.uid || ""}
                                  size="32px"
                                  className="rounded-full shrink-0"
                                  fallbackPhoto={userProfile?.photoURL || currentUser?.photoURL || ""}
                                  fallbackName={userProfile?.displayName || currentUser?.displayName || "Estudante"}
                                />
                                <div className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-full px-4 py-1.5 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={commentInputs[post.id] || ""}
                                    onChange={(e) =>
                                      setCommentInputs((prev) => ({
                                        ...prev,
                                        [post.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Postar sua resposta..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-black dark:text-white placeholder:text-zinc-500 focus:ring-0 p-0"
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        commentInputs[post.id]
                                      ) {
                                        handleSendComment(
                                          post.id,
                                          commentInputs[post.id],
                                        );
                                        setCommentInputs((prev) => ({
                                          ...prev,
                                          [post.id]: "",
                                        }));
                                      }
                                    }}
                                  />
                                  <div className="relative flex items-center">
                                    <button
                                      onClick={() => {
                                        setCommentMentionPostId(
                                          commentMentionPostId === post.id ? null : post.id
                                        );
                                        setMentionSearchTerm("");
                                      }}
                                      type="button"
                                      className="text-accent-1 hover:bg-accent-1/10 p-1.5 rounded-full transition-all font-black text-xs min-h-0"
                                      title="Mencionar colega"
                                    >
                                      @
                                    </button>
                                    {commentMentionPostId === post.id && (
                                      <div className="absolute bottom-9 right-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xl z-50 w-64 max-h-56 overflow-y-auto text-left">
                                        <div className="text-[10px] font-black text-accent-1 uppercase mb-1.5">
                                          Marcar Colega
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Buscar colega..."
                                          value={mentionSearchTerm}
                                          onChange={(e) => setMentionSearchTerm(e.target.value)}
                                          className="w-full bg-slate-950/10 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 text-[10px] font-bold text-black dark:text-white outline-none mb-2"
                                        />
                                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar">
                                          {matchingUsers.length === 0 ? (
                                            <div className="text-[11px] text-zinc-500 py-1 text-center font-bold">
                                              Nenhum colega encontrado
                                            </div>
                                          ) : (
                                            matchingUsers.map((u) => (
                                              <div
                                                key={u.id}
                                                onClick={() => {
                                                  const handle =
                                                    u.handle ||
                                                    u.displayName
                                                      ?.toLowerCase()
                                                      .replace(/\s+/g, "") ||
                                                    "estudante";
                                                  setCommentInputs((prev) => ({
                                                    ...prev,
                                                    [post.id]:
                                                      (prev[post.id] || "") +
                                                      `@${handle} `,
                                                  }));
                                                  setCommentMentionPostId(null);
                                                }}
                                                className="flex items-center gap-2 p-1 rounded hover:bg-zinc-100 dark:hover:bg-slate-900 cursor-pointer text-left transition-colors"
                                              >
                                                <img
                                                  src={
                                                    u.photoURL ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "Estudante")}&background=random`
                                                  }
                                                  className="w-5 h-5 rounded-full"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-[10px] font-bold text-black dark:text-white truncate leading-tight">
                                                    {u.displayName}
                                                  </span>
                                                  <span className="text-[8px] text-accent-1">
                                                    @{u.handle || "estudante"}
                                                  </span>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (commentInputs[post.id]) {
                                        handleSendComment(
                                          post.id,
                                          commentInputs[post.id],
                                        );
                                        setCommentInputs((prev) => ({
                                          ...prev,
                                          [post.id]: "",
                                        }));
                                      }
                                    }}
                                    disabled={!commentInputs[post.id]}
                                    className="p-1 px-2.5 bg-accent-1 hover:bg-accent-2 disabled:opacity-30 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white dark:text-zinc-950 rounded-full text-[10px] font-black uppercase transition-all shrink-0"
                                  >
                                    Responder
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                                {(comments[post.id] || [])
                                  .slice()
                                  .reverse()
                                  .map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="flex gap-3 group/comment-item items-start pl-2"
                                    >
                                      <button
                                        onClick={() =>
                                          window.dispatchEvent(
                                            new CustomEvent("open-profile", {
                                              detail: { uid: comment.authorId },
                                            }),
                                          )
                                        }
                                        className="shrink-0 pt-0.5"
                                      >
                                        <UserAvatar
                                          uid={comment.authorId}
                                          size="32px"
                                          className="rounded-full"
                                          fallbackPhoto={comment.authorPhoto}
                                          fallbackName={comment.authorName}
                                        />
                                      </button>
                                      <div className="flex-1 bg-slate-50 dark:bg-zinc-900/40 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900/80 border border-slate-200/40 dark:border-zinc-800/40 transition-colors relative text-left">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                          <button
                                            onClick={() =>
                                              window.dispatchEvent(
                                                new CustomEvent("open-profile", {
                                                  detail: {
                                                    uid: comment.authorId,
                                                  },
                                                }),
                                              )
                                            }
                                            className="text-xs font-bold text-[#0f1419] dark:text-[#f7f9f9] hover:underline"
                                          >
                                            {comment.authorName}
                                          </button>
                                          <span className="text-[10px] text-zinc-500 font-bold ml-auto">
                                            {formatDate(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 leading-normal font-sans">
                                          {renderContentWithMentions(comment.text)}
                                        </p>

                                        {(currentUser?.uid === comment.authorId ||
                                          currentUser?.uid === post.authorId) && (
                                          <button
                                            onClick={(e) =>
                                              handleDeleteComment(
                                                post.id,
                                                comment.id,
                                                e,
                                              )
                                            }
                                            className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/comment-item:opacity-100 transition-all hover:scale-110 shadow"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                    </motion.article>
                  );
                })}
            </>
          )}
        </div>

        <TrendsSidebar
          userProfile={userProfile}
          currentUser={currentUser}
          trendingSubjects={trendingSubjects}
          topTrendingPhotos={topTrendingPhotos}
          topTrendingPosts={topTrendingPosts}
          onlineUsers={onlineUsers}
          setFilter={setFilter}
          setActiveArea={setActiveArea}
          setActiveTrendView={setActiveTrendView}
          openPostModal={openPostModal}
        />
      </main>

      {exploringItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExploringItem(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(10px)",
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1000px",
              maxHeight: "95vh",
              background: "var(--bg-secondary)",
              border: "1px solid var(--glass-border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={() => setExploringItem(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                zIndex: 10,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                color: "white",
                padding: "10px",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            >
              <X size={24} />
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.8fr",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                <img
                  src={exploringItem.image}
                  alt={exploringItem.title}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, var(--bg-secondary), transparent)",
                  }}
                ></div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "40px",
                    left: "40px",
                    right: "40px",
                    zIndex: 2,
                  }}
                >
                  <a
                    href={exploringItem.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: "100%",
                      padding: "18px",
                      background: "var(--accent-1)",
                      color: "black",
                      border: "none",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      fontSize: "1rem",
                      textDecoration: "none",
                    }}
                  >
                    Acessar Obra <ExternalLink size={20} />
                  </a>
                </div>
              </div>

              <div style={{ padding: "50px", overflowY: "auto" }}>
                <span
                  style={{
                    color: "var(--accent-1)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    fontSize: "0.75rem",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {exploringItem.type} • Guia de Redação
                </span>
                <h2
                  style={{
                    fontFamily: "Anton",
                    fontSize: "4.5rem",
                    textTransform: "uppercase",
                    lineHeight: 0.8,
                    marginBottom: "30px",
                  }}
                >
                  {exploringItem.title}
                </h2>

                <div style={{ marginBottom: "40px" }}>
                  <h3
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 950,
                      textTransform: "uppercase",
                      opacity: 0.8,
                      marginBottom: "15px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Info size={14} /> Sobre a Obra
                  </h3>
                  <p
                    style={{
                      fontSize: "1.1rem",
                      lineHeight: 1.6,
                      opacity: 0.9,
                    }}
                  >
                    {exploringItem.synopsis}
                  </p>
                </div>

                <div style={{ marginBottom: "40px" }}>
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      color: "var(--accent-1)",
                      marginBottom: "25px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Layers size={16} /> Como usar na Redação
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "25px",
                    }}
                  >
                    <div
                      style={{
                        borderLeft: "3px solid var(--accent-1)",
                        paddingLeft: "20px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 950,
                          textTransform: "uppercase",
                          marginBottom: "8px",
                          opacity: 0.8,
                        }}
                      >
                        Na Introdução
                      </h4>
                      <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                        {exploringItem.usage.intro}
                      </p>
                    </div>
                    <div
                      style={{
                        borderLeft: "3px solid var(--accent-1)",
                        paddingLeft: "20px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 950,
                          textTransform: "uppercase",
                          marginBottom: "8px",
                          opacity: 0.8,
                        }}
                      >
                        No Desenvolvimento
                      </h4>
                      <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                        {exploringItem.usage.dev}
                      </p>
                    </div>
                    <div
                      style={{
                        borderLeft: "3px solid var(--accent-1)",
                        paddingLeft: "20px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 950,
                          textTransform: "uppercase",
                          marginBottom: "8px",
                          opacity: 0.8,
                        }}
                      >
                        Na Conclusão
                      </h4>
                      <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                        {exploringItem.usage.conc}
                      </p>
                    </div>
                  </div>
                </div>

                {exploringItem.motivationalTexts &&
                  exploringItem.motivationalTexts.length > 0 && (
                    <div
                      style={{
                        marginBottom: "40px",
                        padding: "24px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: "var(--text-primary)",
                          marginBottom: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Layers size={16} /> Textos Motivacionais
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}
                      >
                        {exploringItem.motivationalTexts.map((text, index) => (
                          <div
                            key={index}
                            style={{
                              background: "rgba(0, 0, 0, 0.2)",
                              padding: "20px",
                              borderRadius: "12px",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                color: "var(--accent-1)",
                                marginBottom: "10px",
                              }}
                            >
                              {text.title}
                            </h4>
                            <p
                              style={{
                                fontSize: "0.95rem",
                                lineHeight: 1.6,
                                opacity: 0.9,
                                marginBottom: "10px",
                                fontStyle: "italic",
                              }}
                            >
                              "{text.content}"
                            </p>
                            <div
                              style={{
                                textAlign: "right",
                                fontSize: "0.75rem",
                                opacity: 0.6,
                                fontWeight: 700,
                              }}
                            >
                              — {text.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--glass-border)",
                    paddingTop: "30px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "45px",
                        height: "45px",
                        background: "var(--accent-1)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "black",
                      }}
                    >
                      <Bot size={24} />
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                        maxWidth: "300px",
                        margin: 0,
                        color: "var(--accent-1)",
                      }}
                    >
                      "{exploringItem.crowTip}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {selectedTrend && (
        <div className="modal" style={{ display: "flex", zIndex: 2000 }}>
          <div
            className="modal-content glass-card"
            style={{ maxWidth: "450px", padding: "30px", position: "relative" }}
          >
            <X
              size={24}
              onClick={() => setSelectedTrend(null)}
              style={{
                position: "absolute",
                right: "20px",
                top: "20px",
                cursor: "pointer",
                opacity: 0.5,
              }}
            />

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "5px",
                }}
              >
                Estatísticas de Tendência
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 900 }}>
                #{selectedTrend.name.replace(/\s/g, "")}
              </h2>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <span
                  className="chip"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    fontSize: "0.75rem",
                  }}
                >
                  {selectedTrend.category}
                </span>
                <span
                  className="chip"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    fontSize: "0.75rem",
                  }}
                >
                  Global
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "25px",
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: "20px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginBottom: "5px",
                  }}
                >
                  Volume de Posts
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {selectedTrend.price}
                </div>
              </div>
              <div
                className="glass-card"
                style={{
                  padding: "20px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginBottom: "5px",
                  }}
                >
                  Variação (24h)
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: selectedTrend.change.startsWith("+")
                      ? "#10b981"
                      : "#ef4444",
                  }}
                >
                  {selectedTrend.change}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  Gráfico de Popularidade
                </span>
                <span style={{ fontSize: "0.75rem", color: "#10b981" }}>
                  Live • {selectedTrend.price} VEST
                </span>
              </div>
              <div
                style={{
                  height: "120px",
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Mock Chart SVG */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,80 Q20,60 40,70 T80,30 T100,20 L100,100 L0,100 Z"
                    fill={
                      selectedTrend.change.startsWith("+")
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)"
                    }
                  />
                  <path
                    d="M0,80 Q20,60 40,70 T80,30 T100,20"
                    fill="none"
                    stroke={
                      selectedTrend.change.startsWith("+")
                        ? "#10b981"
                        : "#ef4444"
                    }
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-main"
                style={{ flex: 1 }}
                onClick={() => {
                  setActiveTrendView({
                    name: selectedTrend.name,
                    category: selectedTrend.category,
                  });
                  setFilter(selectedTrend.name);
                  setSelectedTrend(null);
                  setTrendTab("tudo");
                }}
              >
                Explorar Tópico
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setSearchTerm(selectedTrend.name);
                  setSelectedTrend(null);
                }}
              >
                Ver Busca
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div
          id="post-modal"
          className="modal"
          style={{ display: "flex", zIndex: 3000 }}
        >
          <div
            className="modal-content glass-card flex-col md:flex-row"
            style={{
              maxWidth: "950px",
              width: "95%",
              padding: "0",
              overflow: "hidden",
              display: "flex",
              height: "90vh",
              maxHeight: "1000px",
            }}
          >
            <X
              size={24}
              onClick={() => setSelectedPost(null)}
              style={{
                position: "absolute",
                right: "15px",
                top: "15px",
                zIndex: 10,
                cursor: "pointer",
                color: "white",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "50%",
                padding: "4px",
              }}
            />

            <div
              style={{
                flex: 1.5,
                background: "var(--bg-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid var(--glass-border)",
                position: "relative",
                minHeight: "300px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.1,
                  background:
                    "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                }}
              ></div>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedPost.videoURLs && selectedPost.videoURLs.length > 0 ? (
                  <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-4">
                    {selectedPost.videoURLs.map((url, idx) => (
                      <div
                        key={idx}
                        className="w-full bg-black/40 rounded-2xl border border-white/5 p-4 min-h-[220px] flex items-center justify-center relative"
                      >
                        {url.startsWith("local-media:") ||
                        (url.startsWith("data:") &&
                          !url.startsWith("data:audio/") &&
                          !url.includes("audio")) ? (
                          <div className="w-full max-w-2xl">
                            <LocalMediaRender
                              videoURL={url}
                              postId={`${selectedPost.id}-${idx}`}
                            />
                          </div>
                        ) : url.startsWith("data:audio/") ||
                          url.includes("audio") ||
                          url.endsWith(".mp3") ||
                          url.endsWith(".wav") ||
                          url.endsWith(".ogg") ||
                          url.endsWith(".m4a") ||
                          url.startsWith("data:application/octet-stream") ? (
                          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 w-full rounded-xl text-center">
                            <div className="w-12 h-12 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-3">
                              <Music size={24} />
                            </div>
                            <p className="text-sm font-black mb-3 text-white">
                              Arquivo de Áudio (MP3)
                            </p>
                            <audio
                              src={url}
                              controls
                              className="w-full max-w-sm"
                            />
                          </div>
                        ) : (
                          <video
                            src={url}
                            controls
                            className="max-h-[300px] rounded-xl w-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : selectedPost.mediaType === "video" ||
                  selectedPost.type === "video" ||
                  selectedPost.videoURL ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedPost.videoURL &&
                    (selectedPost.videoURL.startsWith("local-media:") ||
                      (selectedPost.videoURL.startsWith("data:") &&
                        !selectedPost.videoURL.startsWith("data:audio/") &&
                        !selectedPost.videoURL.includes("audio"))) ? (
                      <div className="w-full max-w-2xl px-6">
                        <LocalMediaRender
                          videoURL={selectedPost.videoURL}
                          postId={selectedPost.id}
                        />
                      </div>
                    ) : selectedPost.videoURL?.includes("youtube.com") ||
                      selectedPost.videoURL?.includes("youtu.be") ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedPost.videoURL.split("v=")[1] || selectedPost.videoURL.split("/").pop()}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        allowFullScreen
                      ></iframe>
                    ) : (selectedPost.videoURL &&
                        (selectedPost.videoURL.startsWith("data:audio/") ||
                          selectedPost.videoURL.includes("audio") ||
                          selectedPost.videoURL.endsWith(".mp3") ||
                          selectedPost.videoURL.endsWith(".wav") ||
                          selectedPost.videoURL.endsWith(".ogg") ||
                          selectedPost.videoURL.endsWith(".m4a") ||
                          selectedPost.videoURL.startsWith(
                            "data:application/octet-stream",
                          ))) ||
                      (selectedPost.mediaURL &&
                        (selectedPost.mediaURL.startsWith("data:audio/") ||
                          selectedPost.mediaURL.includes("audio") ||
                          selectedPost.mediaURL.endsWith(".mp3") ||
                          selectedPost.mediaURL.endsWith(".wav") ||
                          selectedPost.mediaURL.endsWith(".ogg") ||
                          selectedPost.mediaURL.endsWith(".m4a") ||
                          selectedPost.mediaURL.startsWith(
                            "data:application/octet-stream",
                          ))) ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 w-full h-full text-center">
                        <div className="w-16 h-16 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-4">
                          <Music size={32} />
                        </div>
                        <p className="text-sm font-black mb-4 text-white">
                          Arquivo de Áudio (MP3)
                        </p>
                        <audio
                          src={selectedPost.videoURL || selectedPost.mediaURL}
                          controls
                          className="w-full max-w-sm"
                        />
                      </div>
                    ) : (
                      <video
                        src={selectedPost.videoURL || selectedPost.mediaURL}
                        controls
                        style={{ width: "100%", height: "100%" }}
                      ></video>
                    )}
                  </div>
                ) : selectedPost.imageURLs &&
                  selectedPost.imageURLs.length > 0 ? (
                  <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-4 items-center justify-start">
                    {selectedPost.imageURLs.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "450px",
                          objectFit: "contain",
                          borderRadius: "16px",
                          border: "1px solid var(--glass-border)",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                ) : selectedPost.imageURL || selectedPost.mediaURL ? (
                  <img
                    src={selectedPost.imageURL || selectedPost.mediaURL}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-primary)",
                    }}
                  >
                    <p
                      className="large-text font-black"
                      style={{ fontSize: "2.5rem", lineHeight: 1.1 }}
                    >
                      {selectedPost.content}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "var(--bg-secondary)",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <UserDisplay
                  uid={selectedPost.authorId}
                  fallbackName={selectedPost.authorName}
                  fallbackPhoto={selectedPost.authorPhoto}
                  fallbackHandle={selectedPost.authorHandle}
                  showHandle={true}
                  size="36px"
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                <div className="mb-8 p-4 bg-accent-1/5 rounded-2xl border border-accent-1/10">
                  <UserDisplay
                    uid={selectedPost.authorId}
                    fallbackName={selectedPost.authorName}
                    fallbackPhoto={selectedPost.authorPhoto}
                    fallbackHandle={selectedPost.authorHandle}
                    showHandle={true}
                    size="40px"
                    className="mb-3"
                  />
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed pl-1">
                    {selectedPost.content}
                  </p>
                </div>

                {postComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="group/comm relative"
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "22px",
                    }}
                  >
                    <UserAvatar
                      uid={comment.authorId}
                      size="32px"
                      className="shrink-0"
                      fallbackPhoto={comment.authorPhoto}
                      fallbackName={comment.authorName}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("open-profile", {
                                detail: { uid: comment.authorId },
                              }),
                            )
                          }
                          className="text-sm font-bold hover:text-accent-1"
                        >
                          {comment.authorName}
                        </button>
                        {(currentUser?.uid === comment.authorId ||
                          currentUser?.uid === selectedPost.authorId) && (
                          <div className="flex items-center gap-1">
                            {deletingCommentId === comment.id ? (
                              <button
                                onClick={(e) =>
                                  handleDeleteComment(
                                    selectedPost.id,
                                    comment.id,
                                    e,
                                  )
                                }
                                className="text-[9px] font-bold text-red-500 hover:bg-red-500/10 px-1 py-0.5 rounded"
                              >
                                Confirmar
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingCommentId(comment.id);
                                }}
                                className="opacity-0 group-hover/comm:opacity-100 p-1 hover:text-red-500 transition-all text-zinc-500"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 pl-11 -mt-1 leading-relaxed">
                        {renderContentWithMentions(comment.text)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{ display: "flex", gap: "20px", marginBottom: "15px" }}
                >
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 transition-all ${likedPosts.has(selectedPost.id) ? "text-accent-1" : "text-zinc-500 hover:text-accent-1"}`}
                  >
                    <Heart
                      size={24}
                      className={
                        likedPosts.has(selectedPost.id) ? "fill-current" : ""
                      }
                    />
                    <span
                      className="font-bold cursor-pointer hover:underline"
                      onClick={(e) => openLikersModal(selectedPost.id, e)}
                    >
                      {selectedPost.likesCount || 0}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <MessageSquare size={24} />
                    <span className="font-bold">
                      {selectedPost.commentsCount || 0}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                    marginBottom: "15px",
                  }}
                >
                  Interações reais da comunidade
                </div>

                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <UserAvatar
                    uid={currentUser?.uid || ""}
                    size="32px"
                    className="border border-accent-1"
                    fallbackPhoto={
                      userProfile?.photoURL || currentUser?.photoURL || ""
                    }
                    fallbackName={
                      userProfile?.displayName ||
                      currentUser?.displayName ||
                      "User"
                    }
                  />
                  <input
                    type="text"
                    placeholder="Adicione um comentário..."
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-white"
                    value={modalCommentInput}
                    onChange={(e) => setModalCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && modalCommentInput.trim()) {
                        handleSendComment(selectedPost.id, modalCommentInput);
                        setModalCommentInput("");
                      }
                    }}
                  />

                  <div className="relative flex items-center">
                    <button
                      onClick={() => {
                        setModalCommentMentionOpen(!modalCommentMentionOpen);
                        setMentionSearchTerm("");
                      }}
                      type="button"
                      className="p-2 text-zinc-400 hover:text-accent-1 rounded-xl transition-all font-black text-sm"
                      title="Mencionar colega"
                    >
                      @
                    </button>
                    {modalCommentMentionOpen && (
                      <div className="absolute bottom-11 right-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 w-64 max-h-56 overflow-y-auto text-left">
                        <div className="text-xs font-black text-accent-1/90 dark:text-accent-1 uppercase mb-2">
                          Marcar Colega
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar colega..."
                          value={mentionSearchTerm}
                          onChange={(e) => setMentionSearchTerm(e.target.value)}
                          className="w-full bg-slate-950/10 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs font-bold text-black dark:text-white outline-none mb-2"
                        />
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar">
                          {matchingUsers.length === 0 ? (
                            <div className="text-xs text-zinc-500 py-1 text-center font-bold">
                              Nenhum colega encontrado
                            </div>
                          ) : (
                            matchingUsers.map((u) => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  const handle =
                                    u.handle ||
                                    u.displayName
                                      ?.toLowerCase()
                                      .replace(/\s+/g, "") ||
                                    "estudante";
                                  setModalCommentInput(
                                    (prev) => prev + `@${handle} `,
                                  );
                                  setModalCommentMentionOpen(false);
                                }}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-900 cursor-pointer text-left transition-colors"
                              >
                                <img
                                  src={
                                    u.photoURL ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "Estudante")}&background=random`
                                  }
                                  className="w-6 h-6 rounded-full"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[11px] font-bold text-black dark:text-white truncate leading-tight">
                                    {u.displayName}
                                  </span>
                                  <span className="text-[9px] text-accent-1">
                                    @{u.handle || "estudante"}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (modalCommentInput.trim()) {
                        handleSendComment(selectedPost.id, modalCommentInput);
                        setModalCommentInput("");
                      }
                    }}
                    disabled={!modalCommentInput.trim()}
                    className="text-accent-1 font-bold text-sm disabled:opacity-50"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {likersModalPostId && (
        <div className="modal" style={{ display: "flex", zIndex: 3000 }}>
          <div
            className="modal-content glass-card"
            style={{
              maxWidth: "400px",
              width: "90%",
              padding: "0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "60vh",
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-black text-lg">Curtidas</h3>
              <button
                onClick={() => setLikersModalPostId(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingLikers ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-4 border-accent-1/20 border-t-accent-1 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Carregando...
                  </p>
                </div>
              ) : likers.length === 0 ? (
                <div className="text-center py-10">
                  <Heart size={40} className="mx-auto text-zinc-800 mb-3" />
                  <p className="text-zinc-500 font-bold">
                    Ninguém curtiu ainda.
                  </p>
                </div>
              ) : (
                likers.map((liker) => (
                  <div
                    key={liker.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <UserDisplay
                        uid={liker.id}
                        fallbackName={liker.displayName}
                        fallbackPhoto={liker.photoURL}
                        fallbackHandle={liker.handle}
                        showHandle={true}
                        size="44px"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setLikersModalPostId(null);
                        window.dispatchEvent(
                          new CustomEvent("open-profile", {
                            detail: { uid: liker.id },
                          }),
                        );
                      }}
                      className="text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                    >
                      Ver Perfil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Post */}
      {postToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-secondary border border-glass-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-black dark:text-white mb-2 uppercase italic tracking-tight">
              Excluir Publicação?
            </h3>
            <p className="text-zinc-500 text-sm mb-8 font-medium">
              Essa ação não pode ser desfeita. Você perderá os comentários e
              curtidas deste post.
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-4 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-mono"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePost(postToDelete)}
                className="flex-1 py-4 px-6 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 font-mono"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Citação (Comentar em cima) */}
      <AnimatePresence>
        {quoteModalPost && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-bg-secondary border border-glass-border rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden mb-auto mt-10 md:mt-20"
            >
              <div className="p-6 border-b border-glass-border flex items-center justify-between">
                <h3 className="text-xl font-black text-text-primary uppercase italic tracking-tighter">
                  Citar Publicação
                </h3>
                <button
                  onClick={() => setQuoteModalPost(null)}
                  className="p-3 rounded-2xl hover:bg-white/5 transition-all text-zinc-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <UserAvatar
                    uid={currentUser?.uid || ""}
                    size="48px"
                    className="rounded-2xl shrink-0"
                  />
                  <textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="O que você acha disso?"
                    className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-black dark:text-white placeholder:text-zinc-600 resize-none min-h-[120px] pt-1"
                    autoFocus
                  />
                </div>

                {/* Preview of quoted post */}
                {quoteModalPost && (
                  <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] ml-16">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={quoteModalPost.authorPhoto}
                        className="w-6 h-6 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-black text-black dark:text-white uppercase">
                        {quoteModalPost.authorName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium tracking-tight">
                        @{quoteModalPost.authorHandle}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                      {quoteModalPost.content}
                    </p>
                    {quoteModalPost.imageURL && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/5 max-h-32">
                        <img
                          src={quoteModalPost.imageURL}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleSendQuote}
                  disabled={!quoteText.trim() || isQuoting}
                  className="px-10 py-5 rounded-2xl bg-accent-1 text-black font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-accent-1/20"
                >
                  {isQuoting ? "Enviando..." : "Publicar Citação"}
                  <Repeat size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareData.url}
        title={shareData.title}
        text={shareData.text}
        theme={theme}
      />
    </Layout>
  );
};

export default Feed;
