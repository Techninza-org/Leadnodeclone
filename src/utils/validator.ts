export const validateLeadCSV = (value: any, fieldName: string): string | null => {
    switch (fieldName) {
        case 'name':
            if (!value) {
                return "Name is required";
            }
            break;

        case 'email':
            if (!value) {
                return "Email is required";
            }
            // if (!validator.isEmail(value)) {
            //     return "Invalid email";
            // }
            break;
        case 'phone':
            if (!value) {
                return "Phone is required";
            }
            // if (!validator.isMobilePhone(value)) {
            //     return "Invalid phone number";
            // }
            break;
        case 'address':
            if (!value) {
                return "Address is required";
            }
            break;
        case 'city':
            if (!value) {
                return "City is required";
            }
            break;
        case 'zip':
            if (!value) {
                return "Zip is required";
            }
            break;
        case 'state':
            if (!value) {
                return "State is required";
            }
            break;
        case 'vehicleName':
            if (!value) {
                return "Vehicle Name is required";
            }
            break;
        case 'vehicleModel':
            if (!value) {
                return "Vehicle Model is required";
            }
            break;
        case 'vehicleDate':
            if (!value) {
                return "Vehicle Date is required";
            }
            break;
        // case 'callStatus':
        //     if (!value) {
        //         return "Call Status is required";
        //     }
        //     break;
        // case 'paymentStatus':
        //     if (!value) {
        //         return "Payment Status is required";
        //     }
        //     break;

        default:
            break;
    }
    return null;
};
