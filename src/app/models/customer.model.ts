export interface Customer {
    id: number;

    // ===== Thông tin cơ bản =====
    customerName?: string;
    cif?: string;
    customerType?: string;

    // ===== Pháp lý =====
    businessRegistrationNo?: string;
    taxCode?: string;

    // ===== Liên hệ =====
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;

    // ===== Người đại diện =====
    representativeName?: string;
    representativeTitle?: string;

    // ===== Tài khoản ngân hàng =====
    bankAccountNo?: string;
    bankName?: string;

    // ===== Trạng thái =====
    status?: string;

    createdAt?: string;
    updatedAt?: string;

    // ===== Quan hệ =====
    userAccountId?: number;
}

export interface CreateCustomerWithAccountRequest {
    customer: Partial<Customer>;
    username: string;
    password: string;
    roleId: number;
}
