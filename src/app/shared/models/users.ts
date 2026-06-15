export interface Role {
    id: number;
    name?: string;
}

export interface User {
    id?: number;
    fullName: string;
    username: string;
    publicId: string; 
    nom: string;   
    password: string;
    enable: boolean;
    roles: Role;
}


export interface Profile {
    id?: string;
    userId?: number;
    photoProfil?: string;
    telephone?: string;
    nomComplet?: string;
    adresse?: string;
    creerPar: string;
    modiferPar: string;
    dateModification: string;
    dateCreation: string;
}

