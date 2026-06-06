# Blueprint Editor Setup

The Blueprint Editor uses **React Flow** for the visual drag-and-drop state machine designer.

## Required Dependencies

Install the following package:

```bash
npm install reactflow
# or
yarn add reactflow
```

## Features Implemented

### 1. Visual Drag-and-Drop State Machine Designer
- **Custom State Nodes**: Visual representation of blueprint states with color coding
- **Custom Transition Edges**: Visual representation of transitions with labels
- **Drag & Drop**: Move states around the canvas
- **Connection Drawing**: Draw transitions between states by dragging
- **MiniMap**: Overview navigation for large blueprints
- **Background Grid**: Dotted grid for visual alignment
- **Controls**: Zoom in/out, fit view controls

### 2. State Management
- **Add States**: Modal form to create new states with:
  - Name and description
  - Color customization
  - Initial/Final state flags
  - Custom icons (optional)
- **Edit States**: Side panel to modify state properties
- **Delete States**: Remove states and their associated transitions
- **Initial State**: Mark one state as the starting point
- **Final States**: Mark one or more states as endpoints

### 3. Transition Configuration Panel
Comprehensive transition configuration drawer with:

#### Guards & Validation
- **Guards (Conditions)**: Define conditions that must be met
  - Has Technician Assigned
  - Has Service Location
  - All Line Items Complete
  - Payment Received
  - Customer Approval
  - Custom guard expressions

#### Required Fields
- Fields that must be filled before transition:
  - Completion Notes
  - Technician Signature
  - Customer Signature
  - Photos
  - Parts Used
  - Custom fields

#### Webhooks & Actions
- **Webhook URLs**: External endpoints to call on transition
- **Auto-execute**: Automatically execute when guards are met
- Visual indicators for transitions with guards/webhooks

### 4. Blueprint Testing/Simulation Mode
Interactive simulation to test blueprint logic:

- **Start Simulation**: Begin from initial state
- **Current State Display**: Shows which state the simulation is in
- **Available Transitions**: Lists all possible transitions from current state
- **Guard Validation**: Prompts for confirmation when guards are present
- **Transition History**: Complete log of simulation path
- **Final State Detection**: Alerts when reaching a final state
- **Reset Capability**: Restart simulation from beginning

### 5. Additional Features

#### Toolbar Actions
- **Save**: Persist blueprint definition
- **Export**: Download blueprint as JSON
- **Import**: Load blueprint from JSON (placeholder)
- **Test**: Launch simulation mode
- **Delete**: Remove selected state or transition

#### Metadata Management
- Blueprint name (editable)
- Entity type selection (Work Order, Appointment, Estimate, Invoice, etc.)
- Description field
- Auto-save indicator

#### Visual Enhancements
- **Color-coded states**: Different colors for visual organization
- **State badges**: "Initial" and "Final" tags
- **Transition badges**: Guard (G) and Webhook (W) indicators
- **Selection highlighting**: Blue border for selected elements
- **Edge labels**: Transition names on connectors
- **Arrow markers**: Clear directional flow

## Usage Example

### Creating a Blueprint

1. **Add States**:
   - Click "Add State" button
   - Fill in name, color, and flags
   - Repeat for all required states

2. **Draw Transitions**:
   - Drag from one state's edge to another state
   - Click the transition to configure
   - Add guards, required fields, and webhooks

3. **Configure Guards**:
   - Select a transition
   - Add guard conditions (e.g., "has_technician")
   - Add required fields (e.g., "completion_notes")
   - Save configuration

4. **Test Blueprint**:
   - Click "Test" button
   - Simulation starts at initial state
   - Click available transitions to navigate
   - Guards will prompt for validation
   - View history of transitions taken

5. **Save Blueprint**:
   - Click "Save Blueprint"
   - Blueprint definition is persisted
   - Can be applied to work orders, estimates, etc.

## Integration with Backend

The blueprint editor generates a JSON structure that matches the backend schema:

```typescript
{
  name: string;
  description: string;
  entity_type: 'work_order' | 'service_appointment' | 'estimate' | 'invoice' | 'service_request';
  definition: {
    states: Array<{
      id: string;
      name: string;
      description?: string;
      color: string;
      is_initial: boolean;
      is_final: boolean;
      position: { x: number; y: number };
    }>;
    transitions: Array<{
      id: string;
      from_state_id: string;
      to_state_id: string;
      name: string;
      guards: string[];
      required_fields: string[];
      webhooks: string[];
    }>;
  };
}
```

## Blueprint Execution Flow

When a blueprint is applied to an entity (e.g., Work Order):

1. **State Validation**: Current state is validated against blueprint
2. **Transition Check**: Available transitions are determined
3. **Guard Evaluation**: All guards must pass for transition to be allowed
4. **Field Validation**: Required fields must be filled
5. **Webhook Trigger**: Configured webhooks are called
6. **State Update**: Entity moves to new state
7. **Audit Log**: Transition is logged for compliance

## Best Practices

1. **Always have exactly ONE initial state**
2. **Have at least ONE final state**
3. **Use descriptive transition names** (e.g., "Approve" not "t1")
4. **Add guards for critical transitions** (e.g., payment required before completion)
5. **Use required fields** to ensure data quality
6. **Test thoroughly** before deploying to production
7. **Export blueprints** as backup before major changes
8. **Use consistent color scheme** for related states

## Advanced Features (Upcoming)

- **Conditional Branches**: Support for complex decision logic
- **Parallel States**: Multiple states active simultaneously
- **Sub-state Machines**: Nested blueprints for complex workflows
- **Blueprint Versioning**: Track changes over time
- **Blueprint Templates**: Pre-built templates for common workflows
- **Analytics**: Track state transition metrics
- **AI Suggestions**: Recommend optimal state flows based on data

## Troubleshooting

### React Flow not rendering
- Ensure `reactflow` package is installed
- Check for CSS import: `import 'reactflow/dist/style.css'`

### States not draggable
- Verify `onNodesChange` is connected to `setNodes`

### Transitions not drawing
- Ensure `onConnect` callback is implemented
- Check that `onEdgesChange` is connected to `setEdges`

### Simulation not working
- Verify at least one state is marked as "Initial"
- Check that transitions are properly connected

## Support

For issues or questions:
- Check the React Flow documentation: https://reactflow.dev
- Review the blueprint engine implementation in server/
- Contact the development team
