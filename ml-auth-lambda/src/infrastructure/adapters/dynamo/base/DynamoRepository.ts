import { ObjectHelper } from '../../../../helpers/ObjectHelper';
import { QueryResponse, ScanResponse } from 'dynamoose/dist/ItemRetriever';
import { AnyItem } from 'dynamoose/dist/Item';
import { HandleIndexHelper } from '../../../../helpers/HandleIndexHelper';

export abstract class DynamoRepository<TEntity> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  protected abstract mapToEntity(item: any): TEntity;

  async save(item: TEntity): Promise<TEntity> {
    try {
      const resp = await this.model.create(item);
      return resp;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(): Promise<TEntity[]> {
    try {
      let allResults: InstanceType<typeof this.model>[] = [];
      const entities: TEntity[] = [];
      let lastKey: any = null;
      let hasMore = true;

      while (hasMore) {
        const scan = this.model.scan();

        if (lastKey) {
          scan.startAt(lastKey); // Continuar desde la última clave
        }

        const result: ScanResponse<AnyItem> = await scan.exec();

        // Acceder correctamente a 'result.items'
        if (result && Array.isArray(result) && result.length > 0) {
          allResults = allResults.concat(result);
        }

        lastKey = result.lastKey; // Actualizar lastKey para la siguiente iteración

        if (!lastKey) {
          hasMore = false; // Terminar el bucle si no hay más elementos
        }
      }

      if (allResults.length === 0) {
        console.log("No items found in the table.");
        return entities;
      }

      allResults.forEach((item) => {
        const entity = this.mapToEntity(item);
        entities.push(entity);
      });

      return entities;
    } catch (error) {
      console.log("Error retrieving all items:", { error });
      throw error;
    }
  }

  async findById(id: string): Promise<TEntity | null> {
    try {
      const item = await this.model.get(id);
      if (!item) {
        console.log(`Item with ID ${id} not found`);
        return null;
      }
      return this.mapToEntity(item);
    } catch (error) {
      console.error(`Error in findById for ID ${id}:`, error);
      // Si es un error de "item not found", retornar null en lugar de lanzar error
      if ((error as any).name === 'DocumentNotFoundError' || (error as any).message?.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.model.delete({ id: id });
    return { id: id };
  }

  async update(id: string, updateParams: Partial<TEntity>): Promise<{
    id: string;
    updateParams: Partial<TEntity>;
    updated: boolean;
  }> {
    try {
      const input = ObjectHelper.removeNullAndEmptyProperties(updateParams);

      const updateObject: any = {};
      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          updateObject[key] = input[key];
        }
      });

      if (Object.keys(updateObject).length === 0) {
        return { id: id, updateParams: updateParams, updated: false };
      }

      await this.model.update({ id: id }, updateObject, { return: "item" });
      return { id: id, updateParams: updateParams, updated: true };
    } catch (error) {
      console.log(`UPDATE operation ERROR: ${id}`);
      throw new Error(`UPDATE operation ERROR: ${id}`);
    }
  }

  async getList(params: {
    index: string;
    pageSize: number;
    order?: string;
    filter?: Partial<TEntity>;
  }): Promise<{ index: string | null; items: TEntity[]  }> {
       
      let result: ScanResponse<TEntity>
       | QueryResponse<TEntity>;

       if(params.filter) {
           //You need to implement the query logic here
           const query = this.model.query("property").eq(params.filter)

           query.limit(params.pageSize);

           if(params.index) {
               query.startAt(params.index);
           }

           result = await query.exec();

       }else{
           const scan = this.model.scan();
           scan.limit(params.pageSize);
          
           if(params.index) {
               scan.startAt(params.index);
           }
          
           result = await scan.exec();
       }

       const newLastKey = result.lastKey ? HandleIndexHelper.codeIndex(result.lastKey) : null;
       return {items: result, index: newLastKey};
  }
}


