import { Button } from '@fluentui/react-components'
import { ChevronLeftFilled } from '@fluentui/react-icons'
import { selectedAppItem } from '../runtimeStore'

export function AppProperties() {
  return (
    <div>
      <Button appearance="subtle" iconPosition="before" icon={<ChevronLeftFilled />}  onClick={() => {selectedAppItem.value = undefined}}>Back</Button>
    
    </div>
  )
}

