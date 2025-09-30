export class HandleIndexHelper {

    public static codeIndex(json: any): string {
        const jsonString = JSON.stringify(json);
        // Crear un buffer a partir de la cadena JSON
        const buffer = Buffer.from(jsonString, 'utf-8');
        // Codificar el buffer en Base64
        return buffer.toString("base64");
    }
 
    public static setIndex(index: string):JSON | undefined {
        let indexResponse = undefined;
        if (index == "null" || index == null || index == undefined) {
            indexResponse = undefined;
        } else {
            try {
                const buffer = Buffer.from(index, 'base64');
                indexResponse = JSON.parse(buffer.toString('utf-8'));
            } catch (error) {
                indexResponse = undefined;
            }
        }
        return indexResponse;
    }
 }
 