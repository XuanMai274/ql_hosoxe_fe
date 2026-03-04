export interface Employee {
    id: number;
    employeeCode: string;
    fullName: string;
    position?: string;
    email: string;
    phone?: string;
    status: string;      // 'ACTIVE' | 'INACTIVE'

    userAccountId?: number;
    username?: string;
    role?: string;       // Role code/name for display
    roleId?: number;
    createdAt?: string;
}

export interface CreateEmployeeWithAccountRequest {
    employee: {
        employeeCode: string;
        fullName: string;
        email: string;
        phone?: string;
        position?: string;
    };
    username: string;
    password: string;
    roleId: number;
}

export interface UpdateEmployeeRequest {
    employeeCode?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    status?: string;
    roleId?: number;
}
