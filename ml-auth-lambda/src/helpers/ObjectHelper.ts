export class ObjectHelper {

    public static removeNullAndEmptyProperties(obj: any) {
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                ObjectHelper.removeNullAndEmptyProperties(obj[key]);
            } else if (obj[key] == null || obj[key] === '') {
                delete obj[key];
            }
        });
        return obj;
    }
 }
 