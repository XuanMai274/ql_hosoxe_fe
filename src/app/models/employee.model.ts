export interface Employee {
    id: number;
    employeeCode?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    status?: string;         // 'ACTIVE' | 'INACTIVE'
    createdAt?: string;
    updatedAt?: string;

    // Thông tin tài khoản
    userAccountId?: number;
    username?: string;
    role?: string;
}

export interface CreateEmployeeWithAccountRequest {
    // Thông tin nhân viên
    employeeCode: string;
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;

    // Thông tin tài khoản
    username: string;
    password: string;
    role: string;
}

export interface UpdateEmployeeRequest {
    fullName?: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    status?: string;
    role?: string;
}
