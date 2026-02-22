export interface FormDataModel {
    invoice_id: string;
    invoice_number: string;
    invoice_date: string;

    vehicle_name: string;
    price: number | string;
    run_number: string;

    chassis_number: string;
    engine_number: string;
    color: string;
    seats: number | string;

    finance_contract_number: string;
    finance_contract_date: string;
    import_date: string;
    export_date: string;
    docs_delivery_date: string;

    asset_name: string;
    issuer_organization: string;
    registration_order_number: string;
    pledge_tax_registration_number: string;

    import_docs?: string[];
    description: string;
}