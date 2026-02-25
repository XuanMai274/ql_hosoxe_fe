import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, CreateEmployeeWithAccountRequest, UpdateEmployeeRequest } from '../models/employee.model';
import { Customer } from '../models/customer.model';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/role.model';

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    private baseUrl = 'http://localhost:8080';

    constructor(private http: HttpClient) { }

    // ===================== EMPLOYEE APIs =====================
    getEmployees(keyword?: string): Observable<Employee[]> {
        let params = new HttpParams();
        if (keyword) params = params.set('keyword', keyword);
        return this.http.get<Employee[]>(`${this.baseUrl}/admin/employees`, { params });
    }

    getEmployeeById(id: number): Observable<Employee> {
        return this.http.get<Employee>(`${this.baseUrl}/admin/employees/${id}`);
    }

    createEmployeeWithAccount(payload: CreateEmployeeWithAccountRequest): Observable<Employee> {
        return this.http.post<Employee>(`${this.baseUrl}/admin/employees/create-with-account`, payload);
    }

    updateEmployee(id: number, payload: UpdateEmployeeRequest): Observable<Employee> {
        return this.http.put<Employee>(`${this.baseUrl}/admin/employees/${id}`, payload);
    }

    deleteEmployee(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/employees/${id}`);
    }

    // ===================== CUSTOMER APIs =====================
    getCustomers(keyword?: string): Observable<Customer[]> {
        let params = new HttpParams();
        if (keyword) params = params.set('keyword', keyword);
        return this.http.get<Customer[]>(`${this.baseUrl}/admin/customers`, { params });
    }

    getCustomerById(id: number): Observable<Customer> {
        return this.http.get<Customer>(`${this.baseUrl}/admin/customers/${id}`);
    }

    createCustomer(payload: Partial<Customer>): Observable<Customer> {
        return this.http.post<Customer>(`${this.baseUrl}/admin/customers`, payload);
    }

    updateCustomer(id: number, payload: Partial<Customer>): Observable<Customer> {
        return this.http.put<Customer>(`${this.baseUrl}/admin/customers/${id}`, payload);
    }

    deleteCustomer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/customers/${id}`);
    }

    // ===================== ROLE APIs =====================
    getRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(`${this.baseUrl}/admin/roles`);
    }

    getRoleById(id: number): Observable<Role> {
        return this.http.get<Role>(`${this.baseUrl}/admin/roles/${id}`);
    }

    createRole(payload: CreateRoleRequest): Observable<Role> {
        return this.http.post<Role>(`${this.baseUrl}/admin/roles`, payload);
    }

    updateRole(id: number, payload: UpdateRoleRequest): Observable<Role> {
        return this.http.put<Role>(`${this.baseUrl}/admin/roles/${id}`, payload);
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/roles/${id}`);
    }
}
