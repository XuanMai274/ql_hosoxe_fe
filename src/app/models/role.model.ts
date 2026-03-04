export interface Role {
    id: number;
    name: string;
    code?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateRoleRequest {
    name: string;
    code: string;
    description?: string;
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string;
}
