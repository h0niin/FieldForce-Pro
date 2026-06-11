import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { CustomField } from '../CUSTOM_FIELDS/custom_fields.entity';
import { MODULE_STANDARD_FIELDS } from '../FIELD_PERMISSIONS/field_permissions.service';

@Injectable()
export class ModuleMappingsService {
  constructor(
    @Inject(KEYNAMES.MODULE_MAPPINGS) private readonly moduleMappingsRepository: any,
    @Inject(KEYNAMES.CUSTOM_FIELDS) private readonly customFieldRepository: typeof CustomField,
  ) {}

  async getMappings(tenantId: string, sourceModule: string, targetModule: string) {
    const query = `
      SELECT * FROM module_mappings 
      WHERE tenant_id = $1 AND source_module = $2 AND target_module = $3;
    `;
    const result = await this.moduleMappingsRepository.query(query, [tenantId, sourceModule, targetModule]);
    
    // Convert JSON array back into flat records that UI expects
    if (result && result.length > 0) {
      const mappingRow = result[0];
      const fieldMappings = typeof mappingRow.field_mappings === 'string' 
        ? JSON.parse(mappingRow.field_mappings) 
        : mappingRow.field_mappings || [];
        
      return fieldMappings.map((m: any, idx: number) => ({
        id: `${mappingRow.id}-${idx}`,
        tenant_id: tenantId,
        source_module: sourceModule,
        target_module: targetModule,
        source_field: m.source_field,
        target_field: m.target_field,
        created_at: mappingRow.created_at,
        updated_at: mappingRow.updated_at,
      }));
    }
    
    // If no custom mapping saved, return default mapping (fields with matching names)
    return this.getDefaultMappings(tenantId, sourceModule, targetModule);
  }

  private async getDefaultMappings(tenantId: string, sourceModule: string, targetModule: string) {
    const { sourceFields, targetFields } = await this.getFields(tenantId, sourceModule, targetModule);
    const sourceFieldNames = new Set(sourceFields.map(f => f.name));
    const targetFieldNames = new Set(targetFields.map(f => f.name));

    // Pre-populated defaults mapping matching Zoho standard fields
    const key = `${sourceModule}->${targetModule}`;
    const defaultPairsMap: Record<string, { source: string; target: string }[]> = {
      'Service Requests->Work Orders': [
        { source: 'subject', target: 'summary' },
        { source: 'description', target: 'description' },
        { source: 'priority', target: 'priority' },
        { source: 'status', target: 'status' },
        { source: 'contact_id', target: 'contact_id' },
        { source: 'location_id', target: 'location_id' },
        { source: 'asset_id', target: 'asset_id' },
        { source: 'category', target: 'category' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
      ],
      'Estimates->Work Orders': [
        { source: 'contact_id', target: 'contact_id' },
        { source: 'asset_id', target: 'asset_id' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
        { source: 'notes', target: 'description' },
        { source: 'status', target: 'status' },
      ],
      'Service Requests->Estimates': [
        { source: 'description', target: 'notes' },
        { source: 'contact_id', target: 'contact_id' },
        { source: 'asset_id', target: 'asset_id' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
        { source: 'status', target: 'status' },
      ],
      'Work Orders->Estimates': [
        { source: 'summary', target: 'notes' },
        { source: 'description', target: 'notes' },
        { source: 'contact_id', target: 'contact_id' },
        { source: 'asset_id', target: 'asset_id' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
        { source: 'status', target: 'status' },
      ],
      'Work Orders->Work Orders': [
        { source: 'summary', target: 'summary' },
        { source: 'description', target: 'description' },
        { source: 'priority', target: 'priority' },
        { source: 'status', target: 'status' },
        { source: 'contact_id', target: 'contact_id' },
        { source: 'location_id', target: 'location_id' },
        { source: 'asset_id', target: 'asset_id' },
        { source: 'category', target: 'category' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
      ],
      'Work Orders->Service Appointments': [
        { source: 'summary', target: 'notes' },
        { source: 'description', target: 'notes' },
        { source: 'status', target: 'status' },
        { source: 'scheduled_start', target: 'scheduled_start' },
        { source: 'scheduled_end', target: 'scheduled_end' },
        { source: 'asset_id', target: 'asset_id' },
      ],
      'Service Appointments->Job Sheets': [
        { source: 'notes', target: 'description' },
      ],
    };

    const finalPairs: { source: string; target: string }[] = [];
    const sourceMapped = new Set<string>();
    const targetMapped = new Set<string>();

    const pairs = defaultPairsMap[key] || [];
    for (const p of pairs) {
      if (sourceFieldNames.has(p.source) && targetFieldNames.has(p.target)) {
        finalPairs.push(p);
        sourceMapped.add(p.source);
        targetMapped.add(p.target);
      }
    }

    // Fallback/auto-map remaining fields if they have exact name & type match and aren't already mapped
    const targetFieldMap = new Map(targetFields.map(f => [f.name, f]));
    for (const sf of sourceFields) {
      if (sourceMapped.has(sf.name)) continue;
      const tf = targetFieldMap.get(sf.name);
      if (tf && tf.type === sf.type && !targetMapped.has(tf.name)) {
        finalPairs.push({ source: sf.name, target: tf.name });
        sourceMapped.add(sf.name);
        targetMapped.add(tf.name);
      }
    }

    return finalPairs.map((p, idx) => ({
      id: `default-${idx}`,
      tenant_id: tenantId,
      source_module: sourceModule,
      target_module: targetModule,
      source_field: p.source,
      target_field: p.target,
    }));
  }

  async getFields(tenantId: string, sourceModule: string, targetModule: string) {
    const fetchFields = async (moduleName: string) => {
      const standard = (MODULE_STANDARD_FIELDS[moduleName] || []).map(f => ({
        name: f.name,
        label: f.label,
        type: 'text', // Inferring basic type for standard fields
        isCustom: false
      }));
      
      const customFields = await this.customFieldRepository.findAll({
        where: { tenant_id: tenantId, module: moduleName, is_deleted: false },
        order: [['sort_order', 'ASC']],
      });
      
      const custom = customFields.map((cf) => ({
        name: cf.field_name,
        label: cf.field_name,
        type: cf.field_type || 'text',
        isCustom: true,
      }));
      
      return [...standard, ...custom];
    };

    return {
      sourceFields: await fetchFields(sourceModule),
      targetFields: await fetchFields(targetModule)
    };
  }

  async save(tenantId: string, sourceModule: string, targetModule: string, mappings: any[], userId: string) {
    // We store all mappings for this pair in a single row's JSON field for simplicity.
    const queryCheck = `SELECT id FROM module_mappings WHERE tenant_id = $1 AND source_module = $2 AND target_module = $3;`;
    const existing = await this.moduleMappingsRepository.query(queryCheck, [tenantId, sourceModule, targetModule]);
    
    const fieldMappingsJson = JSON.stringify(mappings.map(m => ({
      source_field: m.source_field,
      target_field: m.target_field,
      mapping_type: 'direct'
    })));

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      await this.moduleMappingsRepository.query(`
        UPDATE module_mappings
        SET field_mappings = $1, updated_at = NOW(), updated_by = $2
        WHERE id = $3;
      `, [fieldMappingsJson, userId, id]);
    } else {
      await this.moduleMappingsRepository.query(`
        INSERT INTO module_mappings (tenant_id, source_module, target_module, field_mappings, created_by)
        VALUES ($1, $2, $3, $4, $5);
      `, [tenantId, sourceModule, targetModule, fieldMappingsJson, userId]);
    }

    return this.getMappings(tenantId, sourceModule, targetModule);
  }

  async reset(tenantId: string, sourceModule: string, targetModule: string) {
    await this.moduleMappingsRepository.query(`
      DELETE FROM module_mappings 
      WHERE tenant_id = $1 AND source_module = $2 AND target_module = $3;
    `, [tenantId, sourceModule, targetModule]);
    return this.getDefaultMappings(tenantId, sourceModule, targetModule);
  }
}
