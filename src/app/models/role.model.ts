export interface Role {
    id: number;
    roleName: string;     // Tên hiển thị
    roleCode?: string;    // Mã vai trò (ADMIN, OFFICER, ...)
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateRoleRequest {
    roleName: string;
    roleCode: string;
    description?: string;
}

export interface UpdateRoleRequest {
    roleName?: string;
    description?: string;
}
