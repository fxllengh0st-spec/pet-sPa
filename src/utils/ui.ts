
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export const toLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - tzOffset);
    return localTime.toISOString().slice(0, 16);
};

// --- BASE DE IMAGENS REALISTAS (Curadoria UX) ---
// Usamos hash baseado no nome para garantir que o mesmo usuário/pet
// tenha sempre a mesma foto, sem precisar salvar no banco para esta demo.

const PEOPLE_IMAGES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', // Mulher sorrindo
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80', // Homem óculos
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', // Mulher jovem
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', // Homem sorrindo
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', // Mulher séria
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', // Homem barba
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80', // Mulher asiática
    'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80', // Homem perfil
];

export const getAvatarUrl = (name: string) => {
    if (!name) return PEOPLE_IMAGES[0];
    if (name === 'User') return `https://api.dicebear.com/9.x/avataaars/svg?seed=${Date.now()}&backgroundColor=b6e3f4`;

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PEOPLE_IMAGES.length;
    return PEOPLE_IMAGES[index];
};

const DOG_IMAGES = [
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', // Bulldog Francês/Corgi
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80', // Golden Retriever
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80', // Bulldog
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=300&q=80', // Border Collie
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=300&q=80', // Husky
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=300&q=80', // Vira-lata
    'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80', // Golden
    'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&w=300&q=80', // Gato Laranja
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80', // Gato Cinza
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80', // Gato Preto
];

export const getPetAvatarUrl = (petName: string) => {
    if (!petName) return DOG_IMAGES[0];

    const lowerName = petName.toLowerCase();
    const isCatLikely = lowerName.includes('gato') || lowerName.includes('mia') || lowerName.includes('luna') || lowerName.includes('felix') || lowerName.includes('salem');

    let hash = 0;
    for (let i = 0; i < petName.length; i++) {
        hash = petName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Se parece gato, força usar as imagens do final do array
    if (isCatLikely) {
         const catSubset = DOG_IMAGES.slice(-3);
         const index = Math.abs(hash) % catSubset.length;
         return catSubset[index];
    }

    const index = Math.abs(hash) % DOG_IMAGES.length;
    return DOG_IMAGES[index];
};
