

export interface Utilisateur {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    phone: string;
    createdAt: Date
    updatedAt: Date
}


export interface ProfilUtilisateur {
    id: number;
    user: Utilisateur;
    photo_profil: string;
    adresse: string;
    liensReseauxSociaux: string;
    date_naissance: Date;
    estActif: boolean;
    date_inscription: Date;
}